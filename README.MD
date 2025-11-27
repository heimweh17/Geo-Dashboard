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

![Dashboard](screenshots/dashboard.png)

### Heatmap

![Heatmap](screenshots/heatmap.png)

### City Comparison

![City Comparison](screenshots/comparison.png)

### Saved Places

![Saved Places](screenshots/saved-places.png)

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

## Project Structure
src/
  api/               # OSM + Supabase API helpers
  components/        # UI components (Map, Sidebar, Panels, Modals)
  context/           # Auth context (Supabase session)
  utils/             # GIS analytics + CSV export
  App.tsx            # Core app logic

## Live Demo

[https://thegeodashboard.vercel.app/](https://thegeodashboard.vercel.app/)

## Author

**Alex Liu**  
Full-Stack Developer & Geo-Data Enthusiast  
[https://aliu.me](https://aliu.me)
