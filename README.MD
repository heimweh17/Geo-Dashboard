# 🗺️ GeoAnalytica - Geospatial Data Dashboard

A professional-grade GeoAnalytics dashboard built with React and OpenStreetMap. This application provides real-time spatial analysis, allowing users to query urban amenities, visualize density heatmaps, analyze categorical data, and calculate optimal routes using OSRM.

![GeoAnalytica Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot) 
*(Replace this link with a real screenshot after hosting)*

## 🚀 Key Features

### 🔍 Smart Search & Filtering
*   **Global Geocoding**: Search any city worldwide using the Nominatim API.
*   **Amenities Filter**: Instantly locate restaurants, schools, hospitals, and more.
*   **Category Drill-down**: Interactive charts allow deep-diving into sub-categories (e.g., filtering "Restaurants" to show only "Italian Cuisine").

### ✏️ Custom Polygon Analysis
*   **Draw-to-Search**: Go beyond standard radius searches. Use the Polygon tool to draw custom boundaries on the map.
*   **Spatial Queries**: The app fetches data *strictly* within your drawn shape using complex Overpass API geometry queries.

### 🚗 Routing Engine
*   **Integration with OSRM**: Calculates real-time driving/walking routes.
*   **Interactive Wayfinding**: Click any marker to generate a route from your current location, displaying distance and estimated drive time.

### 📊 Data Visualization
*   **Dynamic Heatmaps**: Switch between marker view and density heatmap view to identify clusters.
*   **Live Analytics**:
    *   **Pie Charts**: Breakdown by cuisine, religion, or facility type.
    *   **Bar Charts**: Ranking of top chains or location names.

## 🛠️ Technology Stack

*   **Frontend**: React.js (Vite)
*   **Mapping Engine**: Leaflet, React-Leaflet
*   **Drawing Tools**: Leaflet-Draw
*   **Styling**: Tailwind CSS
*   **Charts**: Recharts
*   **Data APIs**:
    *   **Overpass API**: Raw OSM node/way data.
    *   **Nominatim**: Geocoding (City Search).
    *   **OSRM**: Routing and Directions.

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/heimweh17/geoanalytica.git
    cd geoanalytica
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## 🎮 How to Use

1.  **Search**: Enter a city name (e.g., "Tokyo") in the sidebar.
2.  **Explore**: Select an amenity (e.g., "Cafe"). The map updates instantly.
3.  **Draw**: Click the **Polygon Icon** (top right) and draw a shape on the map. The results will filter to show only items inside that shape.
4.  **Analyze**: Look at the right sidebar. Click a slice of the Pie Chart (e.g., "Japanese") to filter the map to only show Japanese restaurants.
5.  **Route**: Click "Allow Location" in your browser. Click any marker on the map and select **"Get Route"** to see the path and travel time.

## 👨‍💻 Author

**Alex Liu**  
Full Stack Developer & Data Enthusiast

*   **Website**: [aliu.me](https://aliu.me)
*   **GitHub**: [heimweh17](https://github.com/heimweh17)
*   **Email**: haozhouliu17@gmail.com

---
*Data © OpenStreetMap contributors*