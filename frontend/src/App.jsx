import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import logo from './assets/ai routing logo.png';

// ═══════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════
const PinIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const FlagIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>);
const SpinnerIcon = ({ cls = 'w-5 h-5 text-white' }) => (<svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>);
const CheckIcon = () => (<svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const DownloadIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
const SparkIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>);
const AlertIcon = () => (<svg className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>);
const FuelIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm7 14v-3m0-5V7m4 12v-7h2a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>);
const ClockIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const LeafIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16s3-8 12-8m-3 0c0 5.523-4.477 10-10 10" /></svg>);
const CarIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>);
const PrintIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>);
const CopyIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
const BarChartIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const StarIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>);
const QuestionIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const ChevronIcon = ({ open }) => (<svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>);

// ═══════════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER HOOK — triggers animations on scroll
// ═══════════════════════════════════════════════════════════════════
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [threshold]);
  return [ref, visible];
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION WRAPPER — slides in from given direction on scroll
// ═══════════════════════════════════════════════════════════════════
function Reveal({ from = 'bottom', delay = 0, children, className = '' }) {
  const [ref, visible] = useInView();
  const start = { bottom: 'translateY(48px)', left: 'translateX(-56px)', right: 'translateX(56px)', top: 'translateY(-48px)' };
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : start[from], transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GOOGLE MAPS — loader & branded map/satellite control
// ═══════════════════════════════════════════════════════════════════
const mapsLoader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['geometry'],
});

function injectMapControl(map) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;border-radius:8px;overflow:hidden;margin:10px;box-shadow:0 2px 8px rgba(0,0,0,.2);border:1.5px solid #0052a3;background:#fff';
  const mkBtn = (label, type, active) => {
    const b = document.createElement('button');
    b.innerText = label; b.dataset.type = type;
    b.style.cssText = `padding:6px 16px;font-size:12px;font-weight:700;font-family:Inter,sans-serif;cursor:pointer;border:none;outline:none;transition:all .2s;background:${active ? '#0066cc' : '#fff'};color:${active ? '#fff' : '#0052a3'}`;
    b.onclick = () => { map.setMapTypeId(type); wrap.querySelectorAll('button').forEach(x => { const on = x.dataset.type === type; x.style.background = on ? '#0066cc' : '#fff'; x.style.color = on ? '#fff' : '#0052a3'; }); };
    return b;
  };
  wrap.append(mkBtn('Map', 'roadmap', true), mkBtn('Satellite', 'hybrid', false));
  map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(wrap);
}

const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#f5f1eb' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a6042' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1eb' }, { weight: 3 }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8dfd3' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d6ebd1' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8c99e' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d1a364' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#d9984e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e3f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7b9fb5' }] },
];

// ═══════════════════════════════════════════════════════════════════
// DOWNLOAD HELPERS
// ═══════════════════════════════════════════════════════════════════
const save = {
  json: (data, name) => { const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: name }); a.click(); URL.revokeObjectURL(a.href); },
  text: (text, name) => { const b = new Blob([text], { type: 'text/plain' }); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: name }); a.click(); URL.revokeObjectURL(a.href); },
};

// ═══════════════════════════════════════════════════════════════════
// PRICE BAR CHART — pure SVG, no dependencies
// ═══════════════════════════════════════════════════════════════════
function PriceBarChart({ stops, priceStats, onInteract }) {
  if (!stops?.length) return null;
  const bars = [
    { label: 'Min', value: priceStats.min, color: '#16a34a', sub: 'corridor' },
    { label: 'Avg', value: priceStats.avg, color: '#f59e0b', sub: 'corridor' },
    { label: 'Max', value: priceStats.max, color: '#ef4444', sub: 'corridor' },
    ...stops.map((s, i) => ({ label: `Stop ${i + 1}`, value: s.price, color: '#0052a3', sub: s.city?.split(',')[0] || '' })),
  ];
  const maxV = Math.max(...bars.map(b => b.value)) * 1.18;
  const H = 130, bW = 36, gap = 10, padL = 14;
  const W = bars.length * (bW + gap) + padL * 2;
  return (
    <div className="overflow-x-auto -mx-1">
      <svg width="100%" viewBox={`0 0 ${W} ${H + 44}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth: W }}>
        {bars.map((b, i) => {
          const bH = Math.max(4, (b.value / maxV) * H);
          const x = padL + i * (bW + gap);
          const y = H - bH;
          const isStop = b.label.startsWith('Stop');
          const stopIdx = isStop ? parseInt(b.label.replace('Stop ', '')) - 1 : -1;
          return (
            <g key={i}
               className={isStop ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
               onMouseEnter={() => isStop && onInteract(stopIdx, false)}
               onClick={() => isStop && onInteract(stopIdx, true)}
            >
              <rect x={x} y={y} width={bW} height={bH} fill={b.color} rx="5" opacity="0.88" />
              <text x={x + bW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="800">${b.value.toFixed(2)}</text>
              <text x={x + bW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#6b7280" fontWeight="700">{b.label}</text>
              <text x={x + bW / 2} y={H + 27} textAnchor="middle" fontSize="8" fill="#9ca3af">{b.sub.length > 8 ? b.sub.slice(0, 7) + '…' : b.sub}</text>
            </g>
          );
        })}
        <line x1={padL - 2} y1={H} x2={W - padL + 2} y2={H} stroke="#e5e7eb" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH SCORE GAUGE — animated SVG ring
// ═══════════════════════════════════════════════════════════════════
function HealthGauge({ score }) {
  const r = 36, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#0066cc' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Fair';
  return (
    <div className="flex flex-col items-center shrink-0">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 48 48)" style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
        <text x="48" y="52" textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>{score}</text>
      </svg>
      <span className="text-sm font-black" style={{ color }}>{label}</span>
      <span className="text-xs text-slate-400 mt-0.5 font-medium">Route Score</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPANDABLE INSIGHT CARD — click to reveal full detail
// ═══════════════════════════════════════════════════════════════════
function InsightCard({ iconEl, label, summary, detail, accent = '#0066cc', accentBg = '#e7edff', border = '#cad4de', onSave }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border cursor-pointer transition-all hover:shadow-md select-none"
      style={{ borderColor: border, background: accentBg }}
      onClick={() => setOpen(!open)}>
      <div className="p-4 flex items-start gap-3">
        <span className="shrink-0 mt-0.5" style={{ color: accent }}>{iconEl}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-slate-800">{label}</p>
            <div className="flex items-center gap-1 shrink-0">
              {onSave && (
                <button onClick={e => { e.stopPropagation(); onSave(); }}
                  className="p-1 rounded hover:bg-black/5 transition-colors" title="Save">
                  <DownloadIcon />
                </button>
              )}
              <ChevronIcon open={open} />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {!open ? (String(summary).length > 100 ? String(summary).slice(0, 100) + '…' : String(summary)) : String(summary)}
          </p>
        </div>
      </div>
      {open && detail && String(detail) !== String(summary) && (
        <div className="px-4 pb-4 pt-1 border-t text-xs text-slate-700 leading-relaxed" style={{ borderColor: border }}>
          {String(detail).includes('- ') ? (
            <ul className="list-disc pl-4 space-y-1 mt-1">
              {String(detail).split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{l.replace(/^[-*]\s*/, '')}</li>)}
            </ul>
          ) : (
            <p>{String(detail)}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION CARD WRAPPER — consistent card style
// ═══════════════════════════════════════════════════════════════════
function Card({ children, accent, className = '' }) {
  const style = accent ? { borderLeft: `4px solid ${accent}` } : {};
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-md border border-brand-border hover:shadow-lg transition-shadow duration-300 ${className}`} style={style}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, subtitle, badge, onSave }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-brand-primary-hover"
          style={{ background: 'linear-gradient(135deg,#fafbfa,#cad4de)', border: '1.5px solid #0066cc' }}>
          {icon}
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-base leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ background: '#e7edff', color: '#92400e', borderColor: '#cad4de' }}>{badge}</span>}
        {onSave && (
          <button onClick={onSave} title="Download section"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-border transition-colors">
            <DownloadIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [toast, setToast] = useState('');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const mapRef = useRef(null);
  const gmap = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);
  const resultsRef = useRef(null);
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const previewMarkersRef = useRef([]);

  // Load Google Maps
  useEffect(() => { mapsLoader.load().then(() => setMapsReady(true)).catch(console.error); }, []);

  // Init map
  useEffect(() => {
    if (!mapsReady || !mapRef.current || gmap.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 }, zoom: 4,
      styles: MAP_THEME, mapTypeControl: false,
      streetViewControl: true,
      streetViewControlOptions: { position: window.google.maps.ControlPosition.BOTTOM_RIGHT },
      fullscreenControl: true,
      fullscreenControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
    });
    gmap.current = map;
    injectMapControl(map);


  }, [mapsReady]);

  // Clear map overlays
  const clearMap = useCallback(() => {
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    markersRef.current.forEach(m => m.setMap(null)); markersRef.current = [];
    previewMarkersRef.current.forEach(m => m.setMap(null)); previewMarkersRef.current = [];
  }, []);

  // Draw route when data arrives
  useEffect(() => {
    if (!gmap.current || !routeData || !window.google) return;
    clearMap();
    const path = routeData.route_geometry.coordinates.map(([lon, lat]) => ({ lat, lng: lon }));
    polylineRef.current = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: '#0066cc', strokeOpacity: 0.9, strokeWeight: 6, map: gmap.current });
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    gmap.current.fitBounds(bounds, { top: 80, right: 60, bottom: 60, left: 60 });
    // Origin (snapped to route start)
    markersRef.current.push(new window.google.maps.Marker({ position: path[0], map: gmap.current, title: 'Origin', icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }));
    // Destination (snapped to route end)
    markersRef.current.push(new window.google.maps.Marker({ position: path[path.length - 1], map: gmap.current, title: 'Destination', icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }));
    // Fuel stops
    routeData.optimal_stops.forEach((s, i) => {
      const iw = new window.google.maps.InfoWindow({
        content: `<div style="font-family:Inter,sans-serif;padding:4px;color:#1e293b;min-width:150px"><strong style="color:#92400e">Stop ${i + 1}: ${s.name}</strong><br><small style="color:#64748b">${s.city}, ${s.state}</small><br><span style="font-size:15px;font-weight:900;color:#0052a3">$${s.price.toFixed(3)}<small style="font-size:11px;font-weight:400;color:#94a3b8">/gal</small></span></div>`,
      });
      const m = new window.google.maps.Marker({ position: { lat: s.lat, lng: s.lon }, map: gmap.current, label: { text: String(i + 1), color: '#fff', fontSize: '12px', fontWeight: '800' }, icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', zIndex: 10 });
      m.addListener('mouseover', () => iw.open(gmap.current, m));
      m.addListener('mouseout', () => iw.close());
      markersRef.current.push(m);
    });
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
  }, [routeData, clearMap]);

  // Loading step animation
  useEffect(() => {
    if (!loading) return;
    setLoadStep(0);
    const delays = [900, 2200, 4500, 8000, 13000];
    const ts = delays.map((ms, i) => setTimeout(() => setLoadStep(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, [loading]);


  const handlePreview = async (query, setter, label, color) => {
    if (loading) return;
    if (!query || query.length < 3) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', USA')}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
         const lat = parseFloat(data[0].lat);
         const lng = parseFloat(data[0].lon);
         if (window.google && gmap.current) {
            previewMarkersRef.current = previewMarkersRef.current.filter(m => {
              if (m.getTitle() === label) {
                m.setMap(null);
                return false;
              }
              return true;
            });
            const m = new window.google.maps.Marker({
               position: { lat, lng },
               map: gmap.current,
               title: label,
               icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
               zIndex: 20
            });
            previewMarkersRef.current.push(m);
            gmap.current.panTo({ lat, lng });
            gmap.current.setZoom(10);
         }
      }
    } catch(e) {}
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setRouteData(null); clearMap();
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const res = await axios.get(`${base}/route/`, { params: { start, end }, timeout: 180000 });
      setRouteData(res.data);
    } catch (err) {
      setError(err.code === 'ECONNABORTED' ? 'Calculation timed out. Please try again.' : err.response?.data?.error || 'An error occurred. Please try again.');
    } finally { 
      setLoading(false);
      setIsMapExpanded(false); // Collapse map when new results arrive
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  // ── Computed extras ─────────────────────────────────────────────────────
  const extras = routeData ? {
    hours: (routeData.total_distance_miles / 65).toFixed(1),
    co2: ((routeData.total_distance_miles / 10) * 8.887).toFixed(0),
    gallons: (routeData.total_distance_miles / 10).toFixed(1),
    costPerMile: (routeData.total_cost / routeData.total_distance_miles).toFixed(3),
    whatIf: [
      { mpg: 10, label: 'Your Vehicle', sub: '10 MPG', cost: routeData.total_cost, color: '#0066cc', bg: '#e7edff', border: '#cad4de' },
      { mpg: 20, label: 'Efficient Car', sub: '20 MPG', cost: (routeData.total_distance_miles / 20) * routeData.price_stats.avg, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
      { mpg: 40, label: 'Hybrid / EV', sub: '40 MPG equiv.', cost: (routeData.total_distance_miles / 40) * routeData.price_stats.avg, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    ],
  } : null;

  // ── Report generator ────────────────────────────────────────────────────
  const buildReport = () => {
    if (!routeData) return '';
    const rd = routeData; const ca = rd.ai_analysis; const ins = rd.ai_insights;
    return [
      '╔════════════════════════════════════════════════════╗',
      '║   RouteAI Optima — Trip Intelligence Report        ║',
      '╚════════════════════════════════════════════════════╝',
      '',
      `From : ${start}`,
      `To   : ${end}`,
      `Date : ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      '── TRIP SUMMARY ──────────────────────────────────────',
      `Distance      : ${rd.total_distance_miles.toFixed(1)} miles`,
      `Est. Drive    : ~${extras.hours} hours (65 mph avg)`,
      `Fuel Needed   : ${extras.gallons} gallons (10 MPG)`,
      `Total Fuel Cost: $${rd.total_cost.toFixed(2)}`,
      `Cost per Mile : $${extras.costPerMile}`,
      `CO₂ Footprint : ~${extras.co2} kg`,
      `Route Score   : ${rd.trip_health_score}/100`,
      '',
      '── SAVINGS ANALYSIS ──────────────────────────────────',
      `Optimized Cost  : $${rd.total_cost.toFixed(2)}`,
      `Without Opt.    : $${ins.naive_cost.toFixed(2)}`,
      `Total Saved     : $${ins.savings_vs_naive.toFixed(2)} (${ins.savings_pct}%)`,
      '',
      '── FUEL PRICE INTELLIGENCE ───────────────────────────',
      `Route Min  : $${rd.price_stats.min}/gal`,
      `Route Avg  : $${rd.price_stats.avg}/gal`,
      `Route Max  : $${rd.price_stats.max}/gal`,
      `Stations   : ${rd.price_stats.total_stations_found} scanned`,
      rd.corridor_cheapest_state ? `Best State : ${rd.corridor_cheapest_state.state} ($${rd.corridor_cheapest_state.min_price}/gal min)` : '',
      '',
      '── OPTIMAL FUEL STOPS ────────────────────────────────',
      ...rd.optimal_stops.map((s, i) => [`${i + 1}. ${s.name}`, `   ${s.address}, ${s.city}, ${s.state}`, `   $${s.price.toFixed(3)}/gal  ·  Mile ${s.route_dist?.toFixed(0) || '—'} on route`].join('\n')),
      '',
      ...(ca ? [
        '── AI ROUTE ANALYSIS ──────────────────────────────────',
        ca.executive_summary || '',
        '',
        'Strategy:', ca.strategy_insight || '',
        '',
        'Savings:', ca.savings_narrative || '',
        '',
        'Corridor:', ca.corridor_intelligence || '',
        '',
        ...(ca.risk_flags?.length ? ['Risks:', ...ca.risk_flags.map(f => `  ⚠ ${f}`), ''] : []),
        ...(ca.driver_tips?.length ? ['Tips:', ...ca.driver_tips.map((t, i) => `  ${i + 1}. ${t}`), ''] : []),
      ] : ins?.summary ? ['── ANALYSIS ──', ins.summary] : []),
      '',
      '── ASSUMPTIONS ───────────────────────────────────────',
      '  • Vehicle: 10 miles per gallon',
      '  • Tank range: 500 miles maximum',
      '  • Algorithm: Dijkstra\'s shortest-path optimization',
      '  • Station proximity: within 5 miles of route',
      '',
      `Generated : ${new Date().toLocaleString()}  ·  RouteAI Optima`,
    ].join('\n');
  };

  const rd = routeData;
  const ca = rd?.ai_analysis;
  const ins = rd?.ai_insights;

  const LOAD_STEPS = [
    'Geocoding your locations',
    'Fetching road route',
    'Scanning fuel station database',
    'Running optimization algorithm',
    'Generating route intelligence',
    'Building analysis report',
  ];

  const handleStopInteract = useCallback((loc) => {
    if (!gmap.current || !window.google) return;
    gmap.current.panTo({ lat: loc.lat, lng: loc.lng });
    gmap.current.setZoom(12);
    setIsMapExpanded(true); // Open map if it's collapsed
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
  }, []);

  const LOGO_FILTER = 'brightness(0) saturate(100%) invert(26%) sepia(85%) saturate(2250%) hue-rotate(200deg) brightness(97%) contrast(106%)';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-light" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══ TOAST NOTIFICATION ════════════════════════════════════════ */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* ══ MAP SECTION (Always Visible, acts as background or top-sheet) ════════ */}
      <div 
        className={`relative w-full shrink-0 transition-all duration-500 ease-in-out z-0 flex flex-col ${!rd || isMapExpanded ? 'h-screen' : 'h-[40vh] md:h-[45vh]'}`}
      >
        <div ref={mapRef} className="absolute inset-0 z-0 bg-slate-50" />
        
        {/* Map init spinner */}
        {!mapsReady && (
          <div className="absolute inset-0 bg-slate-50 z-10 flex flex-col items-center justify-center">
            <SpinnerIcon cls="w-8 h-8 text-brand-primary" />
            <p className="text-brand-primary-hover text-sm mt-4 font-bold uppercase tracking-widest animate-pulse">Initializing Map…</p>
          </div>
        )}

        {/* ══ FLOATING SEARCH FORM ════════════════════════════════════════ */}
        <div className="absolute bottom-6 left-4 right-4 md:left-6 md:w-[420px] md:right-auto z-40 bg-white/95 backdrop-blur-md shadow-2xl border border-brand-border rounded-2xl p-4 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <img src={logo} alt="RouteAI" className="w-8 h-8 object-contain" style={{ filter: LOGO_FILTER }} />
            <div>
              <p className="font-black text-slate-900 text-[15px] leading-tight">RouteAI Optima</p>
              <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest leading-tight">Fuel Intelligence</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none"><PinIcon /></span>
              <input type="text" ref={startInputRef} value={start} onChange={e => setStart(e.target.value)} onBlur={() => handlePreview(start, setStart, 'Origin', 'green')} placeholder="Origin — city, state or address" required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-border outline-none transition-all" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none"><FlagIcon /></span>
              <input type="text" ref={endInputRef} value={end} onChange={e => setEnd(e.target.value)} onBlur={() => handlePreview(end, setEnd, 'Destination', 'red')} placeholder="Destination — city, state or address" required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-border outline-none transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full px-5 py-2.5 text-sm font-bold text-white rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-70 disabled:transform-none shadow-md"
              style={{ background: 'linear-gradient(135deg,#0066cc,#0052a3)', boxShadow: '0 4px 14px rgba(180,83,9,.25)' }}>
              {loading && <SpinnerIcon cls="w-4 h-4 text-brand-primary" />}
              {loading ? 'Working…' : 'Calculate'}
            </button>
          </form>
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertIcon /> {error}
            </div>
          )}
        </div>

        {/* ══ LOADING OVERLAY (Small Floating Panel) ══════════════════════ */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-brand-border flex flex-col items-center w-72 animate-fade-in">
            <SpinnerIcon cls="w-8 h-8 text-brand-primary mb-3" />
            <p className="font-black text-slate-800 text-sm mb-1">Optimizing Your Route</p>
            <div className="h-4 flex items-center justify-center overflow-hidden w-full">
               <span className="text-xs text-slate-500 font-medium animate-pulse truncate text-center block w-full">{LOAD_STEPS[loadStep]}</span>
            </div>
          </div>
        )}

        {/* ══ EXPAND MAP BUTTON (When results are visible) ════════════════ */}
        {rd && (
          <button 
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="absolute top-4 right-4 z-40 bg-white shadow-lg rounded-full px-4 py-2 font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 border border-slate-200 hover:bg-slate-50 hover:text-brand-primary transition-colors"
          >
             {isMapExpanded ? 'View Results ↓' : 'Expand Map ↑'}
          </button>
        )}
      </div>

      {/* ══ RESULTS SECTION (Scrollable bottom container) ═════════════════ */}
      {rd && !isMapExpanded && (
        <div className="flex-1 overflow-y-auto w-full bg-brand-light z-10 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.15)] relative">
          <div ref={resultsRef} className="max-w-screen-xl mx-auto px-4 lg:px-6 py-10 space-y-8">

          {/* ── SECTION DIVIDER ── */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-brand-border" />
            <div className="flex items-center gap-2 text-xs font-black text-brand-primary-hover uppercase tracking-widest">
              <SparkIcon /> Trip Intelligence Results
            </div>
            <div className="h-px flex-1 bg-brand-border" />
          </div>

          {/* ── ROW 1: 4 Key Metrics ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Distance', val: `${rd.total_distance_miles.toFixed(1)}`, unit: 'miles', icon: <CarIcon />, accentColor: '#64748b', delay: 0, from: 'left' },
              { label: 'Total Fuel Cost', val: `$${rd.total_cost.toFixed(2)}`, unit: 'estimated total', icon: <FuelIcon />, accentColor: '#0066cc', delay: 80, from: 'left' },
              { label: 'Estimated Time', val: `~${extras.hours}h`, unit: 'at 65 mph avg', icon: <ClockIcon />, accentColor: '#3b82f6', delay: 160, from: 'right' },
              { label: 'CO₂ Footprint', val: `${extras.co2} kg`, unit: 'carbon emitted', icon: <LeafIcon />, accentColor: '#16a34a', delay: 240, from: 'right' },
            ].map(m => (
              <Reveal key={m.label} from={m.from} delay={m.delay}>
                <div className="bg-white rounded-2xl p-5 shadow-md border border-brand-border hover:shadow-lg transition-shadow duration-300 group"
                  style={{ borderLeft: `4px solid ${m.accentColor}` }}>
                  <div className="flex items-center gap-2 mb-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                    {m.icon}
                    <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{m.val}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{m.unit}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* ── ROW 2: Savings + Score ── */}
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal from="left">
              <Card accent="#16a34a">
                <CardHeader
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  title="Fuel Savings Achieved"
                  subtitle="Vs. unoptimized stop-at-every-station refueling"
                  onSave={() => save.text(`Fuel Savings Analysis\n${'─'.repeat(35)}\nOptimized Cost : $${rd.total_cost.toFixed(2)}\nWithout Opt.   : $${ins.naive_cost.toFixed(2)}\nTotal Saved    : $${ins.savings_vs_naive.toFixed(2)} (${ins.savings_pct}%)\nGallons Used   : ${extras.gallons}\nCost per Mile  : $${extras.costPerMile}`, 'savings.txt')}
                />
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-6xl font-black text-emerald-600 leading-none">${ins.savings_vs_naive.toFixed(2)}</p>
                    <p className="text-xl font-black text-emerald-500 mt-2">{ins.savings_pct}% cheaper</p>
                  </div>
                  <div className="flex-1 space-y-2.5 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Optimized</span><span className="font-black text-slate-800">${rd.total_cost.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Baseline</span><span className="font-bold text-red-400">${ins.naive_cost.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5"><span className="text-slate-500 font-medium">$/mile</span><span className="font-bold text-slate-700">${extras.costPerMile}</span></div>
                  </div>
                </div>
              </Card>
            </Reveal>

            <Reveal from="right">
              <Card>
                <CardHeader
                  icon={<StarIcon />}
                  title="Route Intelligence Score"
                  subtitle="AI-computed composite efficiency rating"
                  badge="AI Powered"
                />
                <div className="flex items-center gap-6">
                  <HealthGauge score={rd.trip_health_score} />
                  <div className="flex-1 space-y-2.5">
                    {[
                      { label: 'Savings Rate', val: Math.min(100, Math.round(ins.savings_pct * 5)) },
                      { label: 'Station Coverage', val: Math.min(100, Math.round((rd.price_stats.total_stations_found / 20) * 100)) },
                      { label: 'Stop Efficiency', val: rd.optimal_stops.length <= 2 ? 95 : rd.optimal_stops.length <= 4 ? 72 : 52 },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">{m.label}</span>
                          <span className="text-slate-700 font-bold">{m.val}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.val}%`, background: m.val >= 75 ? '#16a34a' : m.val >= 50 ? '#0066cc' : '#ef4444' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Reveal>
          </div>

          {/* ── ROW 3: AI Route Intelligence (no Claude branding) ── */}
          {ca && (
            <Reveal from="bottom" delay={60}>
              <Card className="border-t-4 border-t-brand-primary">
                <CardHeader
                  icon={<SparkIcon />}
                  title="Route Intelligence"
                  subtitle="Intelligent analysis of your specific trip corridor and fuel strategy"
                  badge="AI Powered"
                  onSave={() => {
                    const risks = Array.isArray(ca.risk_flags) ? ca.risk_flags : (ca.risk_flags ? [ca.risk_flags] : []);
                    const tips = Array.isArray(ca.driver_tips) ? ca.driver_tips : (ca.driver_tips ? [ca.driver_tips] : []);
                      save.text([
                        'Route Intelligence Analysis', '='.repeat(40),
                        ca.executive_summary, '\nStrategy:', ca.strategy_insight,
                        '\nSavings:', ca.savings_narrative, '\nCorridor:', ca.corridor_intelligence,
                        ...(risks.length ? ['\nRisks:', ...risks] : []),
                        ...(tips.length ? ['\nDriver Tips:', ...tips.map((t, i) => `${i + 1}. ${t}`)] : []),
                      ].join('\n'), 'route-intelligence.txt');
                    }}
                  />

                {/* Hero summary */}
                {ca.executive_summary && (
                  <div className="mb-5 p-4 rounded-xl text-slate-800 text-sm leading-relaxed font-medium"
                    style={{ background: 'linear-gradient(135deg,#e7edff,#fafbfa)', border: '1.5px solid #0066cc' }}>
                    {ca.executive_summary}
                  </div>
                )}

                {/* Expandable insight cards */}
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  {ca.strategy_insight && (
                    <InsightCard iconEl={<SparkIcon />} label="Optimization Strategy" summary={ca.strategy_insight} detail={ca.strategy_insight}
                      accent="#0052a3" accentBg="#e7edff" border="#cad4de"
                      onSave={() => save.text(ca.strategy_insight, 'strategy.txt')} />
                  )}
                  {ca.savings_narrative && (
                    <InsightCard iconEl={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      label="Savings Intelligence" summary={ca.savings_narrative} detail={ca.savings_narrative}
                      accent="#16a34a" accentBg="#f0fdf4" border="#bbf7d0"
                      onSave={() => save.text(ca.savings_narrative, 'savings-narrative.txt')} />
                  )}
                  {ca.corridor_intelligence && (
                    <InsightCard iconEl={<FlagIcon />} label="Corridor Intelligence" summary={ca.corridor_intelligence} detail={ca.corridor_intelligence}
                      accent="#2563eb" accentBg="#eff6ff" border="#bfdbfe"
                      onSave={() => save.text(ca.corridor_intelligence, 'corridor.txt')} />
                  )}
                  {ca.best_stop_reason && (
                    <InsightCard iconEl={<FuelIcon />} label="Best Stop Selection" summary={ca.best_stop_reason} detail={ca.best_stop_reason}
                      accent="#0052a3" accentBg="#e7edff" border="#cad4de"
                      onSave={() => save.text(ca.best_stop_reason, 'best-stop.txt')} />
                  )}
                </div>

                {/* Risks + Tips */}
                {((Array.isArray(ca.risk_flags) ? ca.risk_flags : (ca.risk_flags ? [ca.risk_flags] : [])).length > 0 || (Array.isArray(ca.driver_tips) ? ca.driver_tips : (ca.driver_tips ? [ca.driver_tips] : [])).length > 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {(Array.isArray(ca.risk_flags) ? ca.risk_flags : (ca.risk_flags ? [ca.risk_flags] : [])).length > 0 && (
                      <div className="rounded-xl p-4 bg-red-50 border border-red-200">
                        <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertIcon /> Route Risk Flags</p>
                        <ul className="space-y-2">
                          {(Array.isArray(ca.risk_flags) ? ca.risk_flags : (ca.risk_flags ? [ca.risk_flags] : [])).map((f, i) => <li key={i} className="flex items-start gap-2 text-xs text-red-800"><span className="text-red-400 shrink-0 mt-0.5">▲</span>{String(f)}</li>)}
                        </ul>
                      </div>
                    )}
                    {(Array.isArray(ca.driver_tips) ? ca.driver_tips : (ca.driver_tips ? [ca.driver_tips] : [])).length > 0 && (
                      <div className="rounded-xl p-4 bg-slate-50 border border-brand-border">
                        <p className="text-xs font-black text-brand-dark uppercase tracking-wider mb-3">Driver Tips</p>
                        <ul className="space-y-2.5">
                          {(Array.isArray(ca.driver_tips) ? ca.driver_tips : (ca.driver_tips ? [ca.driver_tips] : [])).map((tip, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                              <span className="w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0066cc,#0052a3)' }}>{i + 1}</span>
                              {String(tip)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Reveal>
          )}

          {/* ── ROW 4: Fuel Stops ── */}
          {rd.optimal_stops.length > 0 && (
            <Reveal from="bottom">
              <Card>
                <CardHeader
                  icon={<FuelIcon />}
                  title="Optimized Fuel Stops"
                  subtitle={`${rd.optimal_stops.length} stop${rd.optimal_stops.length > 1 ? 's' : ''} — selected from ${rd.price_stats.total_stations_found} stations within 5 miles of route`}
                  badge={`${rd.price_stats.total_stations_found} stations`}
                  onSave={() => save.text(['Optimal Fuel Stops', '─'.repeat(30), ...rd.optimal_stops.map((s, i) => `${i + 1}. ${s.name}\n   ${s.address}, ${s.city}, ${s.state}\n   $${s.price.toFixed(3)}/gal`)].join('\n'), 'fuel-stops.txt')}
                />
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {rd.optimal_stops.map((stop, i) => (
                    <div key={i} className="flex-shrink-0 w-52 rounded-xl p-4 border border-brand-border hover:border-brand-border hover:shadow-lg transition-all duration-200 bg-white group cursor-default">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white group-hover:scale-110 transition-transform"
                          style={{ background: 'linear-gradient(135deg,#0066cc,#0052a3)' }}>{i + 1}</div>
                        {stop.route_dist && <span className="text-xs text-slate-400 font-medium">Mile {Math.round(stop.route_dist)}</span>}
                      </div>
                      <p className="font-black text-slate-800 text-sm leading-tight truncate">{stop.name}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate">{stop.city}, {stop.state}</p>
                      {stop.address && <p className="text-xs text-slate-300 mt-0.5 truncate">{stop.address}</p>}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-2xl font-black text-brand-primary">${stop.price.toFixed(3)}</p>
                        <p className="text-xs text-slate-400 font-medium">per gallon</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}

          {rd.optimal_stops.length === 0 && (
            <Reveal from="bottom">
              <div className="rounded-2xl p-6 bg-emerald-50 border border-emerald-200 flex items-center gap-4 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-black text-emerald-800 text-base">No Fuel Stops Needed</p>
                  <p className="text-sm text-emerald-700 mt-0.5">The destination is within the 500-mile single-tank range. No intermediate stops required.</p>
                </div>
              </div>
            </Reveal>
          )}

          {/* ── ROW 5: Charts ── */}
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal from="left">
              <Card>
                <CardHeader icon={<BarChartIcon />} title="Fuel Price Analysis" subtitle="Your stop prices vs. corridor range" />
                <PriceBarChart stops={rd.optimal_stops} priceStats={rd.price_stats} onInteract={handleStopInteract} />
                <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>Min</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-primary inline-block"></span>Avg</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span>Max</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-accent inline-block"></span>Stops</span>
                </div>
              </Card>
            </Reveal>

            <Reveal from="right">
              <Card>
                <CardHeader
                  icon={<FlagIcon />}
                  title="State Corridor Prices"
                  subtitle="Min price per state along your route"
                  badge={`${rd.state_corridor?.length || 0} states`}
                  onSave={() => save.json(rd.state_corridor, 'state-corridor.json')}
                />
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {rd.state_corridor?.map((s) => {
                    const range = (rd.price_stats.max - rd.price_stats.min) || 0.01;
                    const pct = Math.round(((s.min_price - rd.price_stats.min) / range) * 70 + 15);
                    const cheap = s.min_price <= rd.price_stats.avg;
                    return (
                      <div key={s.state} className="flex items-center gap-3 group">
                        <span className="w-7 text-xs font-black text-slate-700 shrink-0">{s.state}</span>
                        <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cheap ? '#16a34a' : '#0066cc' }} />
                        </div>
                        <span className={`text-xs font-black shrink-0 w-14 text-right ${cheap ? 'text-emerald-600' : 'text-brand-primary'}`}>${s.min_price}</span>
                        <span className="text-xs text-slate-300 shrink-0 w-14">{s.station_count}st.</span>
                      </div>
                    );
                  })}
                </div>
                {rd.corridor_cheapest_state && rd.corridor_priciest_state && rd.state_corridor?.length > 1 && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                    <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-xs text-emerald-600 font-bold uppercase">Cheapest</p>
                      <p className="font-black text-emerald-700 text-lg">{rd.corridor_cheapest_state.state}</p>
                      <p className="text-xs text-emerald-500">${rd.corridor_cheapest_state.min_price}/gal</p>
                    </div>
                    <div className="rounded-xl p-3 bg-red-50 border border-red-100 text-center">
                      <p className="text-xs text-red-500 font-bold uppercase">Priciest</p>
                      <p className="font-black text-red-600 text-lg">{rd.corridor_priciest_state.state}</p>
                      <p className="text-xs text-red-400">${rd.corridor_priciest_state.avg_price}/gal avg</p>
                    </div>
                  </div>
                )}
              </Card>
            </Reveal>
          </div>

          {/* ── ROW 6: What-If Vehicle Comparison ── */}
          <Reveal from="bottom">
            <Card className="border-t-4 border-t-blue-400">
              <CardHeader
                icon={<QuestionIcon />}
                title="What-If Comparison"
                subtitle="How this trip cost changes with a different vehicle fuel efficiency"
                badge="Smart Analysis"
                onSave={() => save.text(['Vehicle Comparison', '─'.repeat(30), ...extras.whatIf.map(w => `${w.label} (${w.sub}): $${w.cost.toFixed(2)}`)].join('\n'), 'vehicle-comparison.txt')}
              />
              <div className="grid grid-cols-3 gap-4">
                {extras.whatIf.map((w, i) => (
                  <div key={i} className="rounded-xl p-5 border-2 text-center transition-all hover:shadow-md"
                    style={{ background: w.bg, borderColor: w.border }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: w.color }}>{w.label}</p>
                    <p className="text-xs font-medium mb-3" style={{ color: w.color, opacity: 0.7 }}>{w.sub}</p>
                    <p className="text-3xl font-black" style={{ color: w.color }}>${w.cost.toFixed(2)}</p>
                    {i > 0 && <p className="text-xs font-bold text-emerald-600 mt-2">Save ${(extras.whatIf[0].cost - w.cost).toFixed(2)}</p>}
                    {i === 0 && <p className="text-xs font-semibold mt-2" style={{ color: w.color, opacity: 0.7 }}>Estimated cost</p>}
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>

          {/* ── ROW 7: Save & Export ── */}
          <Reveal from="bottom" delay={80}>
            <Card>
              <CardHeader icon={<DownloadIcon />} title="Save & Export" subtitle="Download your complete trip plan to any device" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Print Trip Report', sub: 'Save as PDF', icon: <PrintIcon />,
                    style: { background: '#e7edff', borderColor: '#cad4de', color: '#0066cc' },
                    onClick: () => { window.print(); }
                  },
                  {
                    label: 'Route Data', sub: 'Full JSON dataset', icon: <DownloadIcon />,
                    style: { background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' },
                    onClick: () => { save.json(rd, `route-data-${Date.now()}.json`); showToast('JSON downloaded!'); }
                  },
                  {
                    label: 'Fuel Stops', sub: 'Stop list only', icon: <FuelIcon />,
                    style: { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' },
                    onClick: () => { save.text(['Fuel Stops', '─'.repeat(25), ...rd.optimal_stops.map((s, i) => `${i + 1}. ${s.name}\n   ${s.city}, ${s.state} — $${s.price.toFixed(3)}/gal`)].join('\n'), 'fuel-stops.txt'); showToast('Stops downloaded!'); }
                  },
                  {
                    label: 'Copy Link', sub: 'Share this route', icon: <CopyIcon />,
                    style: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' },
                    onClick: () => { navigator.clipboard.writeText(`${window.location.origin}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`).then(() => showToast('Link copied!')); }
                  },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick}
                    className="flex flex-col items-center gap-2.5 py-5 px-3 rounded-xl border-2 font-semibold text-sm transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0"
                    style={btn.style}>
                    <span className="text-current">{btn.icon}</span>
                    <span className="font-bold">{btn.label}</span>
                    <span className="text-xs opacity-60 font-normal">{btn.sub}</span>
                  </button>
                ))}
              </div>
            </Card>
          </Reveal>

          {/* ── FOOTER ── */}
          <Reveal from="bottom">
            <div className="text-center py-6 border-t border-brand-border">
              <div className="flex items-center justify-center gap-2 mb-3">
                <img src={logo} alt="RouteAI" className="w-6 h-6 object-contain" style={{ filter: LOGO_FILTER }} />
                <span className="font-black text-slate-700 text-sm">RouteAI Optima</span>
              </div>
              <p className="text-xs text-slate-400 mb-1">Powered by OSRM routing · OPIS fuel prices · Google Maps</p>
              <p className="text-xs text-slate-400">10 MPG · 500-mile tank range · Dijkstra's shortest-path optimization</p>
            </div>
          </Reveal>

        </div>
        </div>
      )}
    </div>
  );
}
