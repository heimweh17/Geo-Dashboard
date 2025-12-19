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

##  Key Highlights (For Recruiters)

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

###  AI Insights (Optional, Rate-Limited)
- High-level interpretation of spatial results  
- Identifies:
  - Distribution patterns  
  - Category dominance  
  - Spatial bias and data limitations  
- Limit: **1 insight per user per 7 days**

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
