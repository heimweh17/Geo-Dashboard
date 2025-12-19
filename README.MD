## Geo Analytics Backend (FastAPI)

Run locally:

```bash
python -m venv .venv
.\.venv\Scripts\activate           # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Environment variables (optional):
- `SECRET_KEY` (default: dev-secret-change-me)
- `DATABASE_URL` (default: sqlite:///./geo.db)
- `UPLOAD_DIR` (default: storage/uploads)
- `GEMINI_API_KEY` (required for AI insights feature)
- `GEMINI_MODEL` (default: gemini-1.5-flash)
- `AI_MAX_OUTPUT_TOKENS` (default: 600)
- `AUTO_CREATE_TABLES` (set to `true` to bootstrap tables on startup, useful for first deploy on Railway)

### Authentication
- Register: `POST /auth/register` JSON: `{ "email": "user@example.com", "password": "yourPassword123" }`
- Login: `POST /auth/login` (form-encoded: `username`, `password`) → `{ "access_token": "...", "token_type":"bearer" }`
- Current user: `GET /auth/me` with header `Authorization: Bearer <token>`

### Datasets
- Upload: `POST /datasets/upload` (multipart file `file`). Accepts CSV or GeoJSON (FeatureCollection of Points)
  - CSV: latitude/longitude columns matched case-insensitively among: `lat|latitude|y`, `lon|lng|long|longitude|x`
  - Response: `{ "dataset_id", "filename", "file_type", "n_points", "bbox" }`
- List: `GET /datasets` → `{ "items": [...] }`

### Analysis
- Trigger: `POST /analysis/{dataset_id}/analyze` JSON params:
```json
{
  "grid_cell_size": 0.01,
  "dbscan_eps": null,
  "dbscan_eps_km": 1.0,
  "dbscan_min_samples": 5,
  "category_field": "category"
}
```
Notes:
- If `dbscan_eps_km` is provided, DBSCAN uses haversine distance on lat/lon (km). Otherwise uses `dbscan_eps` (degrees).
- Returns `AnalysisRun` record with `result_json`.

- Fetch results: `GET /analysis/{analysis_run_id}`
  - `result_json` includes:
    - `summary`: total points, bbox, mean center, category counts (if field exists)
    - `grid_density`: grid cells with bounds and counts
    - `clustering`: `labels` per point index, cluster sizes and centroids, noise count

### AI Insights
- Generate insight: `POST /ai/insights` JSON body:
```json
{
  "analysis_result": { ... },  // Analysis result object (preferred)
  "analysis_run_id": 123,       // OR analysis run ID to fetch from DB
  "context": {                  // Optional context
    "city_name": "Orlando",
    "viewport_bbox": { ... }
  }
}
```
- Returns: `{ "text": "...", "highlights": ["...", "..."], "meta": {...} }`
- Weekly limit: 1 insight per user per rolling 7 days (HTTP 429 if exceeded)
- Requires: `GEMINI_API_KEY` environment variable

### Example: cURL
```bash
# Register
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"a@b.com\",\"password\":\"Password123\"}"

# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/x-www-form-urlencoded" -d "username=a@b.com&password=Password123" | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Upload CSV
curl -X POST http://localhost:8000/datasets/upload -H "Authorization: Bearer $TOKEN" -F "file=@sample.csv"

# List datasets
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/datasets
```

# Geo Dashboard

GeoAnalytica is an interactive geospatial analytics platform built with React, Leaflet, and OpenStreetMap, designed for both general users and GIS-oriented exploratory analysis. It supports multi-amenity visualization, spatial statistics, city-to-city comparison, user accounts, saved places, and automated insights.

## Key Features

### Core Map Tools

* Global city search (Nominatim)
* Radius-based search (1–20 km)
* Custom area drawing (Leaflet-Draw polygon)
* Amenity layering
  * Restaurants, banks, schools, hospitals, parking, libraries, worship places, fuel, fast food, cafés, bars, universities…
* Heatmap mode (Leaflet-Heat)
* Colored amenity markers for easy category comparison
* Routing preview (origin → destination)

### User Accounts (Supabase)

* Email-based authentication
* Save any place from the map
* Manage saved places in a dedicated dashboard
* View metadata: amenity type, coordinates, tags
* User profile modal

### Analytics Panel

For the selected amenity, automatically computes:

* Total count
* Subtype breakdowns:
  * Cuisine
  * Religion
  * School type
  * Amenity subtype
* Top 5 subcategories
* Brand / chain counts
* Accessibility counts
* Spatial metrics:
  * Density
  * Diversity index
  * Nearest Neighbor Index (NNI)

### City Comparison Mode

Compare two cities (example: Orlando vs Miami) within the same search radius.

**Computed metrics include:**

#### Quantitative

* Total amenity count
* Density (per km²)
* Diversity index
* Cuisine diversity
* Nearest Neighbor Index (clustering vs dispersion)

#### Breakdown Comparisons

* Amenity categories
* Cuisine distribution
* Religion distribution
* School types

#### Interpretation

Automatically explains whether a city:

* Is more clustered or dispersed
* Has a more mixed food culture
* Has stronger amenity concentration
* Shows chain dominance or independent diversity

### Export Tools

* Export CSV of amenity results
* Export comparison tables
* Export detailed GIS analysis
* Export JSON for further research or notebooks

### Automated Insight Generator

Each search produces:

* High-level summary
* Patterns in distribution
* Notable clusters
* Data anomalies or imbalances
* City comparison insights

### Saved Places System

Save any map marker into your personal Supabase database:

* Name, category, tags, coordinates
* Icon previews
* Quick "zoom to" actions
* Delete & manage list

## Screenshots

### Dashboard

![Dashboard](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20221638.png)

![Dashboard](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222156.png)

### Heatmap

![Heatmap](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20221833.png)

### City Comparison

![City Comparison](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222431.png)
![City Comparison](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222448.png)
![City Comparison](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222505.png)

### Saved Places

![Saved Places](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222249.png)

## Tech Stack

### Frontend

* React (Vite)
* TailwindCSS
* Framer Motion
* Lucide Icons

### Mapping

* Leaflet
* Leaflet-Draw
* Leaflet-Heat
* Overpass API
* Nominatim

### Backend

* Supabase Auth + Database
* Custom GIS utility library


## Live Demo

[https://thegeodashboard.vercel.app/](https://thegeodashboard.vercel.app/)

## Author

**Alex Liu**  
Full-Stack Developer & Geo-Data Enthusiast  
[https://aliu.me](https://aliu.me)

## Local Frontend ↔ Backend Integration

Create a `.env` file in project root:

```
VITE_API_BASE_URL=http://localhost:8000
```

Steps to test:
- Start backend:
  - Windows PowerShell
    - `python -m venv .venv`
    - `.\.venv\Scripts\activate`
    - `pip install -r requirements.txt`
    - `uvicorn app.main:app --reload`
- Start frontend:
  - `npm install`
  - `npm run dev` → open http://localhost:5173
- In the sidebar:
  - Click “Sign In / Sign Up” and login with email/password (stored as JWT `geo_token` in localStorage)
  - In the “Compare Cities” section, click “Upload Dataset” and select a CSV or GeoJSON
  - After upload, note the dataset id and point count shown
  - (Optional) Run Analysis with default params; results panel shows summary, bbox, mean center, category counts, clusters

Notes:
- If requests fail due to CORS, ensure backend allows `http://localhost:5173`.
- Backend returns `result_json` as a string; frontend parses with `JSON.parse` safely.
