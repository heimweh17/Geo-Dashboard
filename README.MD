# GeoDashboard

**AI-Assisted Geospatial Analytics Platform**

GeoDashboard is a full-stack geospatial analytics platform that combines interactive mapping, spatial statistics, and cost-aware AI-generated insights.

The project is built as a university capstone-style system to demonstrate full-stack development, backend system design, service-oriented architecture, distributed deployment, CI/CD workflows, and responsible AI integration in a production-style environment.

🔗 **Live Demo**: [https://thegeodashboard.vercel.app/](https://thegeodashboard.vercel.app/)

## Overview

GeoDashboard enables users to explore spatial point data, perform quantitative geospatial analysis, and receive AI-assisted interpretations of spatial patterns.

Rather than treating AI as a black box, the system emphasizes:

- Deterministic spatial computation first
- AI as an interpretive and explanatory layer
- Explicit cost, rate-limit, and reliability constraints

This mirrors real-world data platforms where AI augments—not replaces—core analytics.

## Key Capabilities

### Interactive Geospatial Exploration
- Map-based visualization of spatial point data
- Amenity layering and category-based coloring
- Heatmaps and spatial density overlays
- City-to-city comparative views

### Dataset-Driven Analytics
- Upload CSV or GeoJSON point datasets
- Automatic latitude/longitude field detection
- Bounding box and metadata computation
- Persisted analysis runs for reproducibility

### Spatial Analysis Engine
- Grid-based density computation
- DBSCAN clustering (degree-based or haversine distance in kilometers)
- Category and subtype aggregation
- Quantitative city comparison metrics

### AI-Assisted Insights
- AI-generated analytical summaries based on structured spatial results
- Strict per-user weekly rate limits
- Usage tracked and enforced at the database level
- AI focused on interpretation, not computation

## System Architecture

### Frontend
- React (Vite) for a fast development workflow
- Leaflet for interactive map rendering
- TailwindCSS + Framer Motion for responsive UI and transitions
- Deployed on Vercel

### Backend
- FastAPI for high-performance APIs
- SQLAlchemy ORM
- PostgreSQL (hosted on Railway)
- JWT-based authentication
- Dockerized services with environment-aware configuration
Link: [https://github.com/heimweh17/gdashboardbackend]

## Service-Oriented & Distributed Design

The system is designed with a service-oriented architecture, separating core geospatial functionality from AI-powered insight generation.

### Core Backend Service
- Handles authentication, datasets, spatial analysis, and persistence
- Implements deterministic geospatial algorithms
- Built with FastAPI, SQLAlchemy, and PostgreSQL

### AI Insight Service
- Dedicated service for LLM-powered analytical summaries
- Deployed independently to isolate AI workloads
- Communicates with the core backend via HTTP APIs
- Enforces strict rate limits to control cost and latency

### Architectural Benefits
- **Scalability**: AI workloads scale independently from core analytics
- **Reliability**: Core features remain available even if AI services fail
- **Cost Control**: AI usage is strictly bounded per user
- **Production-Minded Design**: Reflects real microservice and distributed system patterns

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

##  Local Development (Backend)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

##  Educational Focus

This project was built to:

- Practice backend system design beyond CRUD  
- Apply geospatial analytics in a real UI  
- Integrate AI responsibly and economically  
- Debug and deploy a real production stack  

Design choices favor **clarity, maintainability, and realism** over novelty.

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
