# RouteAI Optima - Intelligent Fuel Routing Platform

RouteAI Optima is an advanced, production-ready routing platform that computes the most cost-effective path between two geographic points in the United States while mathematically optimizing fuel stops based on an integrated 8,000+ location fuel pricing database. The app leverages bleeding-edge graphing mathematics and Anthropic's Claude Haiku 3.5 AI to act as an automated logistics consultant.

## Architecture & Tech Stack

**Frontend:** React, Vite, TailwindCSS (for baseline utilities), Custom CSS Variables (for Spotter.ai specific theme overrides).
**Backend:** Django, Django REST Framework, NetworkX (for graph logic), Anthropic SDK.

## Key Technical Decisions

### 1. Data Source & The CSV
The core of the fuel pricing engine is the client-provided `fuel-prices-for-be-assessment.csv`. 
To balance performance with accuracy, we parse the `.csv` directly in memory when the Django application starts up. We then map the addresses from the CSV against a pre-computed JSON geocoding cache. This allows us to strictly utilize the provided CSV's price data without hitting rate limits by attempting to geocode 8,000+ points on every startup, ensuring instantaneous API response times.

### 2. Why `db.sqlite3`?
While the core shortest-path routing algorithm runs entirely in-memory using `NetworkX` graphs (which allows it to bypass slow disk I/O and SQL queries), `db.sqlite3` is shipped with the Django project as the default relational database. It is currently initialized to support future session management, user authentication (if drivers need to save routes), and logging/audit trails.

### 3. Claude AI Integration
The project heavily leverages Claude AI (`claude-3-5-haiku`) to transform raw routing data into "Route Intelligence". The features include:
- **Optimization Strategy**: Explaining *how* the algorithm saved money.
- **Corridor Intelligence**: Identifying regional price trends across states.
- **Route Risk Flags**: Warning drivers of "fuel deserts" or sparse refueling options.
- **Driver Tips**: Actionable logistics advice.
- **Food & Rest Recommendations**: Advanced cross-referencing to suggest rest stops.
- **Weather & Traffic Advisory**: Providing seasonal or historical traffic bottleneck warnings.

## Setup & Running Instructions

### Backend (Django)
1. Open a terminal and navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`
3. Activate it:
   - Mac/Linux: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Install requirements: `pip install -r requirements.txt`
5. Start the server: `python manage.py runserver 8000`

### Frontend (Vite/React)
1. Open a separate terminal and navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

### Environment Variables (.env)
The project requires `.env` files. Ensure they contain the necessary API keys (Anthropic API Key and Google Maps API Key for the frontend map renderer). No hardcoded credentials exist in the codebase.
