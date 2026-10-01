import json
import os
import anthropic
import networkx as nx
import requests
from django.conf import settings
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 3959.0 # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ─── Load fuel stations once into memory at startup ───────────────────────────
import csv
CSV_FILE = os.path.join(settings.BASE_DIR, '..', 'fuel-prices-for-be-assessment.csv')
GEO_FILE = os.path.join(settings.BASE_DIR, '..', 'fuel_stations.json')
STATIONS = []

try:
    # 1. Load geocoding cache mapping to prevent 8,000+ API calls
    geo_cache = {}
    if os.path.exists(GEO_FILE):
        with open(GEO_FILE, 'r') as f:
            for s in json.load(f):
                # Use a combined key to prevent collisions
                geo_cache[s.get('address', '')] = (s.get('lat'), s.get('lon'))
                
    # 2. Parse actual data from the client-provided CSV file
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                addr = row.get('Address', '')
                if addr in geo_cache:
                    lat, lon = geo_cache[addr]
                    if lat and lon:
                        STATIONS.append({
                            'name': row.get('Truckstop Name', 'Unknown'),
                            'address': addr,
                            'city': row.get('City', ''),
                            'state': row.get('State', ''),
                            'price': float(row.get('Retail Price', 3.50)),
                            'lat': lat,
                            'lon': lon
                        })
except Exception as e:
    print(f"Failed to load CSV: {e}")

# ─── OSRM routing URL ─────────────────────────────────────────────────────────
OSRM_URL = getattr(
    settings, 'OSRM_API_URL',
    "http://router.project-osrm.org/route/v1/driving/"
    "{start_lon},{start_lat};{end_lon},{end_lat}"
    "?overview=full&geometries=geojson"
)

# ─── Vehicle constants ────────────────────────────────────────────────────────
MPG = 10.0
MAX_RANGE = 500.0


# ─── AI Client (lazy init so missing key doesn't crash startup) ────────
def _get_ai_client():
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key or api_key.startswith('your-'):
        return None
    return anthropic.Anthropic(api_key=api_key)


# ─── RouteAI: Generate comprehensive trip analysis ─────────────────────────
def _ai_trip_analysis(
    start_addr, end_addr,
    total_miles, total_cost, naive_cost,
    optimal_stops, state_corridor,
    price_stats, trip_health_score,
    savings_pct
):
    """
    Call RouteAI intelligent model to generate context-aware
    trip analysis covering strategy, risk, tips, and savings intelligence.
    Returns a dict of structured AI sections, or None if API key is missing.
    """
    client = _get_ai_client()
    if not client:
        return None

    stops_text = "\n".join([
        f"  Stop {i+1}: {s['name']} in {s['city']}, {s.get('state','')} — ${s['price']:.3f}/gal "
        f"(at mile {s.get('route_dist', 0):.0f})"
        for i, s in enumerate(optimal_stops)
    ]) or "  No stops needed — destination within single-tank range."

    states_text = ", ".join([
        f"{s['state']} (min ${s['min_price']:.3f})"
        for s in (state_corridor or [])[:8]
    ])

    gallons = total_miles / MPG

    prompt = f"""You are RouteAI Optima's expert fuel route analyst for commercial and personal vehicle operators across the USA.

Analyze this trip and provide structured, data-driven insights:

TRIP DATA:
- Route: {start_addr} → {end_addr}
- Total Distance: {total_miles:.1f} miles
- Estimated Fuel Needed: {gallons:.1f} gallons (at 10 MPG)
- Optimized Fuel Cost: ${total_cost:.2f}
- Without Optimization (naive): ${naive_cost:.2f}
- Savings Achieved: ${naive_cost - total_cost:.2f} ({savings_pct:.1f}%)
- Trip Health Score: {trip_health_score}/100
- Fuel Price Range on Route: ${price_stats['min']:.3f} – ${price_stats['max']:.3f}/gal (avg ${price_stats['avg']:.3f})
- States Traversed: {states_text or 'N/A'}
- Number of Fuel Stops: {len(optimal_stops)}

OPTIMAL STOPS:
{stops_text}

Respond ONLY with a valid JSON object (no markdown, no extra text) with exactly these keys:

{{
  "executive_summary": "2-3 sentence intelligent summary of this specific trip's fuel economics and optimization quality.",
  "strategy_insight": "2-3 sentences on WHY this stop sequence is optimal — explain the pricing geography, where prices are lowest, and what the algorithm exploited.",
  "risk_flags": ["list of 1-3 short risk strings if any, e.g. sparse stations in a stretch, high-price state, long gap between stops. Empty array if no risks."],
  "driver_tips": ["list of exactly 3 actionable, specific tips for this route — practical advice a real driver would value."],
  "savings_narrative": "1-2 sentence explanation of the ${naive_cost - total_cost:.2f} savings in plain language that makes it feel tangible.",
  "best_stop_reason": "1 sentence explaining which stop is the best deal and why.",
  "corridor_intelligence": "1-2 sentences on the fuel price landscape of the specific states/region this route passes through.",
  "food_and_rest_recommendations": "2-3 sentences advising on where to take a break, sleep or eat along this specific geographic route, considering the stops.",
  "weather_and_traffic_advisory": "1-2 sentences highlighting potential seasonal weather hazards or major traffic bottlenecks on this specific route."
}}"""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            raw = match.group(0)
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"executive_summary": raw, "strategy_insight": "", "risk_flags": [],
                "driver_tips": [], "savings_narrative": "", "best_stop_reason": "",
                "corridor_intelligence": "", "food_and_rest_recommendations": "", "weather_and_traffic_advisory": ""}
    except Exception:
        return None


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _compute_naive_cost(total_miles, stations_along_route):
    if not stations_along_route:
        return (total_miles / MPG) * 3.50
    avg_price = sum(s['price'] for s in stations_along_route) / len(stations_along_route)
    return (total_miles / MPG) * avg_price


def _compute_rule_based_insights(total_miles, total_cost, naive_cost, optimal_stops, start_addr, end_addr):
    """Fallback rule-based summary used when AI API key is not configured."""
    savings = naive_cost - total_cost
    savings_pct = (savings / naive_cost * 100) if naive_cost > 0 else 0
    gallons = total_miles / MPG
    cost_per_mile = total_cost / total_miles if total_miles > 0 else 0
    num_stops = len(optimal_stops)

    if num_stops == 0:
        stop_sentence = "The destination is within single-tank range — no fuel stops required."
    elif num_stops == 1:
        stop_sentence = (f"1 optimal stop identified at {optimal_stops[0]['name']} "
                         f"in {optimal_stops[0]['city']}, {optimal_stops[0].get('state', '')}.")
    else:
        cheapest = min(optimal_stops, key=lambda s: s['price'])
        stop_sentence = (f"{num_stops} optimal stops selected. Best deal: "
                         f"{cheapest['name']}, {cheapest['city']} at ${cheapest['price']:.3f}/gal.")

    if savings_pct >= 10:
        savings_sentence = f"Optimized routing saves ${savings:.2f} ({savings_pct:.1f}%) vs filling up at every station."
    elif savings_pct > 0:
        savings_sentence = f"Optimization saves ${savings:.2f} ({savings_pct:.1f}%) over unplanned refueling."
    else:
        savings_sentence = "Fuel prices along this corridor are fairly uniform."

    return {
        "summary": (f"Your trip from {start_addr} to {end_addr} covers {total_miles:.1f} miles, "
                    f"requiring ~{gallons:.1f} gallons. {stop_sentence} {savings_sentence}"),
        "cost_per_mile": round(cost_per_mile, 4),
        "gallons_needed": round(gallons, 2),
        "savings_vs_naive": round(savings, 2),
        "savings_pct": round(savings_pct, 1),
        "naive_cost": round(naive_cost, 2),
    }


def _compute_trip_health_score(savings_pct, num_stops, total_miles, stations_found):
    score = 60
    score += min(savings_pct * 0.8, 20)
    coverage = min(stations_found / max(total_miles / 50, 1), 1.0)
    score += coverage * 10
    ideal_stops = max(1, int(total_miles / 400))
    score -= min(abs(num_stops - ideal_stops) * 3, 10)
    return max(0, min(100, round(score)))


def _compute_state_breakdown(stations_along_route):
    state_prices = {}
    for s in stations_along_route:
        st = s.get('state', '').strip()
        if st:
            state_prices.setdefault(st, []).append(s['price'])
    breakdown = [
        {
            'state': st,
            'min_price': round(min(p), 3),
            'avg_price': round(sum(p) / len(p), 3),
            'station_count': len(p),
        }
        for st, p in state_prices.items()
    ]
    return sorted(breakdown, key=lambda x: x['min_price'])


# ─── Route Planner View ────────────────────────────────────────────────────────
class RoutePlannerView(APIView):
    def get(self, request):
        start_addr = request.query_params.get('start', '').strip()
        end_addr = request.query_params.get('end', '').strip()

        if not start_addr or not end_addr:
            return Response(
                {"error": "Please provide both 'start' and 'end' query parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Geocode locations
        try:
            def geocode(addr):
                url = f"https://nominatim.openstreetmap.org/search?q={requests.utils.quote(addr + ', USA')}&format=json&limit=1"
                res = requests.get(url, headers={'User-Agent': 'ai_routing_backend_v2'}, timeout=10)
                data = res.json()
                if data and len(data) > 0:
                    return {'lat': float(data[0]['lat']), 'lng': float(data[0]['lon'])}
                return None

            start_loc = geocode(start_addr)
            end_loc = geocode(end_addr)
        except Exception as e:
            return Response({"error": f"Geocoding unavailable: {e}"}, status=503)

        if not start_loc:
            return Response({"error": f"Could not find: '{start_addr}'"}, status=400)
        if not end_loc:
            return Response({"error": f"Could not find: '{end_addr}'"}, status=400)

        s_lat, s_lon = start_loc['lat'], start_loc['lng']
        e_lat, e_lon = end_loc['lat'], end_loc['lng']

        # 2. Fetch road route (single OSRM call)
        try:
            resp = requests.get(
                OSRM_URL.format(start_lon=s_lon, start_lat=s_lat, end_lon=e_lon, end_lat=e_lat),
                timeout=30
            )
            rd = resp.json()
            if rd.get('code') != 'Ok':
                return Response({"error": "Routing failed. Verify both locations are in the USA."}, status=400)
        except Exception as e:
            return Response({"error": f"Routing service error: {e}"}, status=500)

        route = rd['routes'][0]
        geometry = route['geometry']
        coords = geometry['coordinates']  # [[lon, lat], ...]

        # 3. Cumulative distance along route
        dist_along = [0.0]
        for i in range(1, len(coords)):
            p1 = (coords[i-1][1], coords[i-1][0])
            p2 = (coords[i][1], coords[i][0])
            dist_along.append(dist_along[-1] + geodesic(p1, p2).miles)
        total_miles = dist_along[-1]

        # 4. Bounding-box pre-filter
        min_lon = min(c[0] for c in coords) - 0.6
        max_lon = max(c[0] for c in coords) + 0.6
        min_lat = min(c[1] for c in coords) - 0.6
        max_lat = max(c[1] for c in coords) + 0.6
        candidates = [s for s in STATIONS
                      if min_lat <= s['lat'] <= max_lat and min_lon <= s['lon'] <= max_lon]

        # 5. Find stations within 5 mi of route
        step = max(1, len(coords) // 500)
        route_sample = [(i, coords[i]) for i in range(0, len(coords), step)]
        stations_on_route = []
        for s in candidates:
            s_lat, s_lon = s['lat'], s['lon']
            best_dist, best_idx = float('inf'), 0
            for idx, c in route_sample:
                # Fast bounding box check (1 deg is ~69 miles)
                # 5 miles is ~0.07 degrees
                if abs(s_lat - c[1]) > 0.08 or abs(s_lon - c[0]) > 0.08:
                    continue
                d = haversine(s_lat, s_lon, c[1], c[0])
                if d < best_dist:
                    best_dist, best_idx = d, idx
            if best_dist <= 5.0:
                sc = dict(s)
                sc['route_dist'] = dist_along[best_idx]
                sc['detour_miles'] = round(best_dist, 2)
                stations_on_route.append(sc)
        stations_on_route.sort(key=lambda x: x['route_dist'])

        # 6. Dijkstra's shortest path
        avg_price = (sum(s['price'] for s in stations_on_route) / len(stations_on_route)
                     if stations_on_route else 3.50)
        nodes = [
            {'id': 'start', 'route_dist': 0.0, 'price': avg_price,
             'lat': s_lat, 'lon': s_lon, 'name': 'Start', 'city': start_addr, 'state': ''},
            *stations_on_route,
            {'id': 'end', 'route_dist': total_miles, 'price': 0.0,
             'lat': e_lat, 'lon': e_lon, 'name': 'End', 'city': end_addr, 'state': ''},
        ]
        G = nx.DiGraph()
        for i, n in enumerate(nodes):
            G.add_node(i, **n)
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                dist = nodes[j]['route_dist'] - nodes[i]['route_dist']
                if dist <= MAX_RANGE:
                    G.add_edge(i, j, weight=(dist / MPG) * nodes[i]['price'])
                else:
                    break
        try:
            path = nx.shortest_path(G, source=0, target=len(nodes)-1, weight='weight')
            total_cost = nx.shortest_path_length(G, source=0, target=len(nodes)-1, weight='weight')
        except nx.NetworkXNoPath:
            return Response(
                {"error": "Cannot reach destination within a 500-mile range."},
                status=400
            )

        optimal_stops = [nodes[i] for i in path if i not in (0, len(nodes)-1)]

        # 7. Analytics
        naive_cost = _compute_naive_cost(total_miles, stations_on_route)
        rule_insights = _compute_rule_based_insights(
            total_miles, total_cost, naive_cost, optimal_stops, start_addr, end_addr
        )
        savings_pct = rule_insights['savings_pct']
        trip_health_score = _compute_trip_health_score(
            savings_pct, len(optimal_stops), total_miles, len(stations_on_route)
        )
        state_corridor = _compute_state_breakdown(stations_on_route)
        all_prices = [s['price'] for s in stations_on_route]
        price_stats = {
            'min': round(min(all_prices), 3) if all_prices else 0,
            'max': round(max(all_prices), 3) if all_prices else 0,
            'avg': round(sum(all_prices) / len(all_prices), 3) if all_prices else 0,
            'total_stations_found': len(stations_on_route),
        }

        # 8. RouteAI analysis
        ai_analysis = _ai_trip_analysis(
            start_addr, end_addr,
            total_miles, total_cost, naive_cost,
            optimal_stops, state_corridor,
            price_stats, trip_health_score,
            savings_pct
        )

        return Response({
            # Core routing
            "route_geometry": geometry,
            "total_distance_miles": round(total_miles, 2),
            "total_cost": round(total_cost, 2),
            "optimal_stops": optimal_stops,
            "start_coords": [s_lon, s_lat],
            "end_coords": [e_lon, e_lat],

            # Rule-based analytics (always present)
            "ai_insights": rule_insights,
            "trip_health_score": trip_health_score,
            "price_stats": price_stats,
            "state_corridor": state_corridor,
            "corridor_cheapest_state": state_corridor[0] if state_corridor else None,
            "corridor_priciest_state": state_corridor[-1] if state_corridor else None,

            # AI analysis (present only when API key is configured)
            "ai_analysis": ai_analysis,
        })


# ─── Fuel Stats View ──────────────────────────────────────────────────────────
class FuelStatsView(APIView):
    """
    GET /api/fuel-stats/           → national summary
    GET /api/fuel-stats/?state=TX  → per-state breakdown
    """
    def get(self, request):
        state = request.query_params.get('state', '').strip().upper()
        if not state:
            all_prices = [s['price'] for s in STATIONS if 'price' in s]
            by_state = {}
            for s in STATIONS:
                st = s.get('state', '').strip().upper()
                if st:
                    by_state.setdefault(st, []).append(s['price'])
            summary = sorted([
                {'state': st, 'avg_price': round(sum(p)/len(p), 3),
                 'min_price': round(min(p), 3), 'station_count': len(p)}
                for st, p in by_state.items()
            ], key=lambda x: x['avg_price'])
            return Response({
                'national_avg': round(sum(all_prices)/len(all_prices), 3) if all_prices else 0,
                'national_min': round(min(all_prices), 3) if all_prices else 0,
                'national_max': round(max(all_prices), 3) if all_prices else 0,
                'by_state': summary,
            })

        state_stations = [s for s in STATIONS if s.get('state', '').strip().upper() == state]
        if not state_stations:
            return Response({"error": f"No stations found for state: {state}"}, status=404)

        prices = [s['price'] for s in state_stations]
        return Response({
            'state': state,
            'station_count': len(state_stations),
            'avg_price': round(sum(prices)/len(prices), 3),
            'min_price': round(min(prices), 3),
            'max_price': round(max(prices), 3),
            'cheapest_stations': sorted(state_stations, key=lambda x: x['price'])[:5],
        })
