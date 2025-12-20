# GeoDashboard

**AI-Assisted Geospatial Analytics Platform**

A full-stack geospatial analytics platform that combines interactive mapping, spatial statistics, and cost-aware AI-generated insights.

Built as a university project to demonstrate backend system design, geospatial data modeling, and responsible AI integration in a production-style environment.

 **Live Demo:** https://thegeodashboard.vercel.app/

---

## What This Project Does

GeoDashboard allows users to:

- Explore and visualize geospatial point data on an interactive map  
- Upload spatial datasets (CSV / GeoJSON)  
- Run spatial analyses (density grids, clustering, category breakdowns)  
- Compare cities quantitatively and qualitatively  
- Generate AI-powered analytical insights with strict usage limits  

This project emphasizes **interpretability, scalability, and cost awareness**, rather than raw AI output.

---

##  Key Highlights

###  Real Backend Engineering
- FastAPI backend with JWT authentication  
- SQLAlchemy ORM with PostgreSQL (production)  
- Dockerized deployment on Railway  
- Environment-aware configuration (local vs production)

###  Applied Geospatial Analytics
- Bounding box computation  
- Density grids  
- DBSCAN clustering (degree-based or haversine km)  
- Category and subtype breakdowns  
- City-to-city metric comparison  

###  Responsible AI Integration
- AI insights are rate-limited (**1 per user per 7 days**)  
- AI is used for **interpretation**, not raw computation  
- Prompts explicitly include methodological caveats  
- Usage tracked in the database to prevent abuse  

---

##  System Architecture

### Frontend
- React (Vite)  
- Leaflet (map rendering)  
- TailwindCSS + Framer Motion  
- Hosted on Vercel  

### Backend
- FastAPI  
- SQLAlchemy  
- PostgreSQL (Railway)  
- JWT authentication  
- AI service integration (Google Gemini)  

This project is designed with a **service-oriented architecture** in mind, separating
core geospatial analytics from AI-powered insight generation.

- **Core Backend Service**
  - Handles authentication, datasets, spatial analysis, and persistence
  - Built with FastAPI + SQLAlchemy + PostgreSQL
- **AI Insight Service**
  - Dedicated service for LLM-powered analytical summaries
  - Isolated to control cost, latency, and rate limits
  - Communicates via HTTP API

This separation improves:
- Scalability (AI workloads can scale independently)
- Reliability (core features remain available even if AI services are unavailable)
- Cost control (AI usage can be strictly rate-limited per user)

---

##  Project Structure (Backend)

```text
gdashboardbackend/
├── app/
│   ├── main.py            # FastAPI entrypoint
│   ├── core/              # config & security
│   ├── db/
│   │   ├── database.py    # engine & session
│   │   └── models.py      # ORM models
│   ├── routers/
│   │   ├── auth.py
│   │   ├── datasets.py
│   │   ├── analysis.py
│   │   ├── places.py
│   │   └── ai.py          # AI insights endpoint
│   └── services/
├── Dockerfile
├── requirements.txt
└── README.md
```

##  Core Features

###  Authentication
- Email + password registration  
- Secure password hashing (Argon2)  
- Token-based access control  

###  Dataset Management
- Upload CSV or GeoJSON point datasets  
- Automatic detection of latitude / longitude fields  
- Metadata storage (point count, bounding box)  

###  Spatial Analysis
- Density grid computation  
- DBSCAN clustering (supports km-based distance)  
- Category and subtype aggregation  
- Persisted analysis runs  

### AI Insights (Microservice)

The AI Insights feature is implemented as an independent service powered by
Google Gemini.

Key characteristics:

- Accepts structured spatial analysis results (JSON)
- Produces high-level analytical summaries and highlights
- Enforces **per-user weekly usage limits** to prevent abuse
- Designed to be stateless and horizontally scalable

This service focuses on **interpretation rather than computation**,
acting as an analytical layer on top of deterministic spatial algorithms.

### CI / CD

The project uses a lightweight **Continuous Integration (CI)** pipeline powered by
GitHub Actions.

On every push and pull request, the pipeline automatically:

- Installs dependencies
- Verifies successful application import and startup configuration

This ensures:
- Early detection of broken imports or configuration errors
- Consistent deployability across environments




---

##  AI Insight Workflow

1. User requests AI insight from the UI  
2. Backend checks weekly usage limit  
3. Aggregates spatial analysis results  
4. Constructs structured analytical prompt  
5. Calls Gemini API  
6. Stores usage record  
7. Returns summarized insight  

This design demonstrates **production-minded AI usage**, not unlimited inference.

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
