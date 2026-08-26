# GeoDashboard

**AI-Assisted Geospatial Analytics Platform**

GeoDashboard is a full-stack geospatial analytics platform that integrates interactive spatial visualization, deterministic geospatial analysis, and cost-aware AI-generated insights.

The project is designed as a university capstone–style system with a strong emphasis on **backend system design, service-oriented architecture, distributed deployment, CI/CD workflows, and responsible AI integration** in a production-like environment.

🔗 **Live Demo**: https://thegeodashboard.vercel.app/

---

## Overview

GeoDashboard enables users to explore spatial point data, perform quantitative geospatial analysis, and receive AI-assisted interpretations of spatial patterns.

Rather than treating AI as a black-box solution, the system follows a layered analytical approach:

- Deterministic geospatial computation first  
- AI used strictly as an interpretive and explanatory layer  
- Explicit constraints on cost, rate limits, and reliability  

This mirrors real-world data platforms where AI augments — rather than replaces — core analytical pipelines.

---

## Key Capabilities

### Interactive Geospatial Exploration
- Map-based visualization of spatial point data
- Category-based layering and color encoding
- Heatmaps and spatial density overlays
- City-to-city comparative views

### Dataset-Driven Analytics
- Upload CSV or GeoJSON point datasets
- Automatic latitude / longitude field detection
- Bounding box and dataset metadata computation
- Persisted analysis runs to ensure reproducibility

### Spatial Analysis Engine
- Grid-based density computation
- DBSCAN clustering (degree-based or haversine distance in kilometers)
- Category and subtype aggregation
- Quantitative metrics for city-level comparison

### AI-Assisted Insights
- AI-generated analytical summaries based on structured spatial results
- Strict per-user weekly rate limits
- Usage tracked and enforced at the database level
- AI focused on interpretation and pattern explanation, not raw computation

---

## System Architecture

### Frontend
- React (Vite) for fast iteration and modular UI design
- Leaflet for interactive map rendering
- TailwindCSS + Framer Motion for responsive layouts and transitions
- Deployed on Vercel

### Backend
- FastAPI for high-performance API services
- SQLAlchemy ORM for data modeling and persistence
- PostgreSQL (hosted on Railway)
- JWT-based authentication and access control
- Dockerized services with environment-aware configuration

Backend Repository:  
https://github.com/heimweh17/gdashboardbackend

---

## Service-Oriented & Distributed Design

GeoDashboard is implemented using a **service-oriented, microservices-inspired architecture**, separating core geospatial functionality from AI-powered insight generation.

### Core Backend Service
- Handles authentication, dataset ingestion, spatial analysis, and persistence
- Implements deterministic geospatial algorithms
- Built with FastAPI, SQLAlchemy, and PostgreSQL
- Deployed on Railway as the primary application backend

### AI Insight Service
- Dedicated microservice for LLM-powered analytical summaries
- Deployed independently on **AWS** to isolate AI workloads
- Communicates with the core backend via HTTP APIs
- Enforces strict rate limits to control cost and latency

### Architectural Benefits
- **Scalability**: AI workloads scale independently from core analytics
- **Reliability**: Core features remain available even if AI services are unavailable
- **Cost Control**: AI usage is explicitly bounded per user
- **Production-Oriented Design**: Reflects real-world microservice and distributed system patterns

### CI / CD Pipeline

The project implements a lightweight but production-oriented **Continuous Integration (CI)** workflow using **GitHub Actions**.

On every push and pull request to the main branch, the CI pipeline automatically:

- Sets up a clean Python environment
- Installs backend dependencies
- Verifies application import and startup configuration
- Fails early on broken imports, missing environment bindings, or configuration errors

This CI setup ensures that:

- Code pushed to production is always deployable
- Configuration regressions are caught before deployment
- Distributed services remain consistent across environments

While deployment is currently handled by managed platforms (Railway and AWS), the CI pipeline is designed to be easily extended into a full **CI/CD workflow** (e.g., automated container builds and service redeployments).

This approach reflects real-world engineering tradeoffs: prioritizing **stability, observability, and cost-awareness** over unnecessary pipeline complexity.

## Backend Project Structure

---

##  Environment Variables (Backend)

```env
DATABASE_URL=postgresql://...
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_api_key
AI_MODEL_NAME=models/gemini-1.5-flash
ENVIRONMENT=production
```

## Map / Geodata Services

CARTO's Voyager raster basemap requires an API key. Request a free, domain-restricted key at [CARTO Basemaps](https://carto.com/basemaps/apikey/) and set `VITE_CARTO_API_KEY` in `.env.local`. Do not commit this value. The app appends the key only to the CARTO tile URL.

The frontend currently uses public OpenStreetMap ecosystem endpoints directly:

- `Nominatim` for city/place search
- `Overpass API` for amenity / POI queries
- `OSRM` for routing
- `Carto` raster tiles for the basemap

These are configured in `env.example` and can be swapped without code changes:

```env
VITE_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org/search
VITE_OVERPASS_API_URL=https://overpass-api.de/api/interpreter
VITE_OSRM_BASE_URL=https://router.project-osrm.org/route/v1
VITE_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
VITE_MAP_TILE_ATTRIBUTION=&copy; OSM
```

Important:

- Public OpenStreetMap services are not production-grade API-key products by default.
- If higher reliability or larger traffic is needed, replace them with a hosted provider or self-hosted service.

##  Local Development (Backend)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Educational Focus

This project was developed to simulate a production-oriented data platform and to deepen practical understanding of modern backend and system design concepts.

Key learning objectives include:

- Designing backend systems beyond basic CRUD operations  
- Applying geospatial analytics in a real, user-facing application  
- Integrating AI services responsibly with explicit cost and usage constraints  
- Deploying and debugging distributed services in a production-like environment  
- Implementing CI workflows to ensure deployment stability  

Design decisions emphasize **clarity, maintainability, and engineering realism** over novelty or purely experimental features.


---

## Screenshots 
### Dashboard ![Dashboard](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-12-19%20175301.png)![Dashboard](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20221638.png) ![Dashboard](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222156.png) 
### AI Insights ![AI](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-12-19%20174500.png)
### Local Dataset ![Local](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-12-19%20174605.png)
### Heatmap ![Heatmap](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20221833.png) 
### City Comparison ![City Comparison](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222431.png) ![City Comparison](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222448.png) ![City Comparison](https://github.com/heimweh17/Geo-Dashboard/blob/main/pics/Screenshot%202025-11-26%20222505.png)

---

##  Author

**Alex Liu**  
Computer Science @ University of Florida  
Full-Stack & Geospatial Data Enthusiast  

🌐 https://aliu.me  
🔗 https://github.com/heimweh17  

---

##  Possible Extensions

- Structured AI output (JSON → charts)  
- Cached AI insights  
- Multi-city batch comparison  
- Research-oriented export formats  
