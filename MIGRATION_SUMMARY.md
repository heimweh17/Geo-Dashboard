# Migration Summary: Supabase → Backend + SQLite → Postgres

This document summarizes all changes made to migrate Saved Places from Supabase to the FastAPI backend and switch from SQLite to Postgres for production.

## Backend Changes

### 1. Database Configuration (`app/core/config.py`)
- Added `normalize_database_url()` to convert `postgres://` to `postgresql+psycopg2://`
- Added `cors_origins` config with comma-separated origins
- Changed `sqlalchemy_database_url` to a property that normalizes the URL

### 2. Database Engine (`app/db/database.py`)
- Updated to support both SQLite and Postgres
- Added connection pooling for Postgres
- Conditional `connect_args` based on database type

### 3. Models (`app/db/models.py`)
- Added `Place` model with:
  - `id` (UUID string, 36 chars)
  - `user_id` (FK to users)
  - `name`, `category`, `lat`, `lon`, `notes`, `tags` (JSON)
  - `created_at` timestamp
- Added relationship in `User` model: `places`

### 4. Schemas (`app/schemas/places.py`)
- `PlaceBase`: Base fields
- `PlaceCreate`: For POST requests
- `PlaceUpdate`: For PATCH requests (all optional)
- `PlaceOut`: Response model

### 5. Router (`app/routers/places.py`)
- `GET /places` - List all places for current user
- `POST /places` - Create new place
- `GET /places/{place_id}` - Get specific place
- `PATCH /places/{place_id}` - Update place
- `DELETE /places/{place_id}` - Delete place
- All endpoints require JWT authentication
- 401/403/404 error handling

### 6. Main App (`app/main.py`)
- Added `places` router
- Updated CORS to use `settings.cors_origins_list`
- Conditional table creation (only for SQLite dev, not production)

### 7. Requirements (`requirements.txt`)
- Added `psycopg2-binary==2.9.9` for Postgres support

### 8. Alembic Migrations
- Created `alembic.ini` configuration
- Created `alembic/env.py` with model imports
- Created `alembic/script.py.mako` template
- Created initial migration `001_initial_migration.py` with all tables

## Frontend Changes

### 1. API Client (`src/lib/api.js`)
- Added `listPlaces(token)` - GET /places
- Added `createPlace(token, payload)` - POST /places
- Added `updatePlace(token, placeId, payload)` - PATCH /places/{id}
- Added `deletePlace(token, placeId)` - DELETE /places/{id}

### 2. Saved Places Service (`src/services/savedPlacesService.js`)
- **Removed all Supabase imports and calls**
- Updated to use backend API via `api.js`
- `savePlace()` → `createPlace()`
- `getSavedPlaces()` → `listPlaces()` (no longer needs userId param)
- `deletePlace()` → `deletePlaceAPI()`
- `updatePlace()` → `updatePlaceData()`
- `isPlaceSaved()` now uses `listPlaces()` and checks lat/lon

### 3. App Component (`src/App.tsx`)
- Removed `import { supabase } from './lib/supabaseClient'`
- Updated `handleConfirmSave()` to:
  - Use `getSavedPlaces()` instead of Supabase query
  - Use new API payload format (`name`, `category`, `lat`, `lon`, `tags`, `notes`)

### 4. SavedPlacesModal (`src/components/SavedPlacesModal.jsx`)
- Updated field names:
  - `place.place_name` → `place.name`
  - `place.amenity_type` → `place.tags?.amenity`
  - Added `place.tags?.cuisine` display

### 5. ProfileModal (`src/components/ProfileModal.jsx`)
- No changes needed (already uses `getSavedPlaces()`)

## Deployment Files

### 1. `.gitignore`
- Added database files (`*.db`)
- Added Python cache files
- Added environment files

### 2. `DEPLOYMENT.md`
- Complete deployment guide for Render
- Environment variables documentation
- Migration commands
- Troubleshooting guide

### 3. `migrate.sh`
- Helper script for running Alembic migrations

## Migration Steps (For Deployment)

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables** (Render dashboard):
   - `DATABASE_URL` (from Render Postgres)
   - `SECRET_KEY` (generate strong random string)
   - `CORS_ORIGINS` (comma-separated frontend URLs)

3. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Migrations run successfully
- [ ] Can register/login users
- [ ] Can create saved places
- [ ] Can list saved places (filtered by user)
- [ ] Can update saved places
- [ ] Can delete saved places
- [ ] CORS works from frontend
- [ ] Frontend displays saved places correctly
- [ ] No Supabase calls remain in frontend

## Breaking Changes

1. **API Payload Format**: Saved places now use:
   - `name` instead of `place_name`
   - `tags` (object) instead of separate `amenity_type` field
   - `category`, `lat`, `lon`, `notes` remain similar

2. **Authentication**: All places endpoints require JWT Bearer token

3. **User ID**: Frontend no longer passes `user_id`; backend extracts from JWT token

## Notes

- Supabase client (`src/lib/supabaseClient.js`) still exists but is no longer used for saved places
- SQLite is still used for local development (fallback when `DATABASE_URL` not set)
- Postgres is required for production (Render)
- Alembic migrations are required for schema changes (no more auto-create in production)

