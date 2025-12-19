# Deployment Guide: Geo Dashboard Backend (Render)

This guide covers deploying the FastAPI backend to Render with Postgres.

## Prerequisites

- Render account
- Postgres database created on Render
- Backend service configured on Render

## Environment Variables (Render)

Set these in your Render service dashboard:

### Required

- `DATABASE_URL` - Postgres connection string (provided by Render Postgres service)
  - Example: `postgres://user:pass@host:5432/dbname`
  - The app automatically converts `postgres://` to `postgresql+psycopg2://`

- `SECRET_KEY` - JWT secret key (generate a strong random string)
  - Example: `openssl rand -hex 32`

- `CORS_ORIGINS` - Comma-separated list of allowed origins
  - Example: `https://thegeodashboard.vercel.app,http://localhost:5173`
  - Defaults to: `http://localhost:5173,https://thegeodashboard.vercel.app`

### Optional

- `UPLOAD_DIR` - Directory for uploaded files (default: `storage/uploads`)
- `ENVIRONMENT` - Set to `production` to disable auto table creation (default: not set)

## Build & Start Commands

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Or with gunicorn (recommended for production):
```bash
alembic upgrade head && gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

## Local Development

### Setup

1. Install dependencies:
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Set environment variables (or use `.env` file):
```bash
# For local SQLite (default)
# No DATABASE_URL needed

# For local Postgres
export DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/geo_db"
```

3. Run migrations:
```bash
# Create initial migration (first time only)
alembic revision --autogenerate -m "init"

# Apply migrations
alembic upgrade head
```

4. Start server:
```bash
uvicorn app.main:app --reload
```

## Database Migrations

### Create a new migration
```bash
alembic revision --autogenerate -m "description"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback
```bash
alembic downgrade -1  # Rollback one version
alembic downgrade base  # Rollback all
```

## Frontend Environment Variables (Vercel)

Set in Vercel dashboard:

- `VITE_API_BASE_URL` - Your Render backend URL
  - Example: `https://your-backend.onrender.com`

## Testing

1. **Backend health**: `GET https://your-backend.onrender.com/docs` (Swagger UI)

2. **Register user**:
```bash
curl -X POST https://your-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

3. **Login**:
```bash
curl -X POST https://your-backend.onrender.com/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=Password123"
```

4. **Test places endpoint** (with token):
```bash
curl -X GET https://your-backend.onrender.com/places \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Migration errors
- Ensure `DATABASE_URL` is set correctly
- Check Postgres connection from Render dashboard
- Run `alembic current` to see current migration version

### CORS errors
- Verify `CORS_ORIGINS` includes your frontend URL
- Check browser console for exact error

### Database connection errors
- Verify `DATABASE_URL` format (should start with `postgres://` or `postgresql+psycopg2://`)
- Check Postgres service is running on Render
- Verify network/security settings allow connections

## Notes

- The app automatically converts `postgres://` URLs to SQLAlchemy-compatible format
- In production (`ENVIRONMENT=production`), tables are NOT auto-created; use Alembic migrations
- SQLite is used as fallback if `DATABASE_URL` is not set (local dev only)

