import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import AnalyticsPanel from './components/AnalyticsPanel';
import { searchCity, fetchAmenities, fetchRoute } from './api/osmService';

function App() {
  const [city, setCity] = useState('Orlando, FL');
  const [coordinates, setCoordinates] = useState([28.5383, -81.3792]);
  const [amenity, setAmenity] = useState('restaurant'); 
  const [radius, setRadius] = useState(1500);
  const [data, setData] = useState([]); // Raw data from OSM
  const [loading, setLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [customPolygon, setCustomPolygon] = useState(null);

  // NEW: State for filtering by category (e.g., "Italian")
  const [categoryFilter, setCategoryFilter] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("Location access denied")
      );
    }
    loadData(coordinates[0], coordinates[1], amenity, radius, null);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const loadData = async (lat, lon, type, rad, poly = null) => {
    setLoading(true);
    setData([]); 
    setRouteData(null); 
    setCategoryFilter(null); // Reset filters on new search

    try {
      const results = await fetchAmenities(lat, lon, type, rad, poly);
      setData(results);
    } catch (error) {
        console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Derived State for Filtering ---
  // If a category is selected, only show those items. Otherwise show all.
  const filteredData = categoryFilter
    ? data.filter(item => {
        const cuisine = item.tags.cuisine || "";
        const religion = item.tags.religion || "";
        const type = item.tags['school:type'] || "";
        // Check if the tag matches the selected filter (Case insensitive)
        return (
            cuisine.toLowerCase().includes(categoryFilter.toLowerCase()) || 
            religion.toLowerCase().includes(categoryFilter.toLowerCase()) ||
            type.toLowerCase().includes(categoryFilter.toLowerCase())
        );
      })
    : data;


  // --- Handlers ---
  const handleCitySearch = async (cityName) => {
    setLoading(true);
    setCategoryFilter(null);
    setData([]);
    setRouteData(null); // Clear route on new city
    try {
      const location = await searchCity(cityName);
      if (location) {
        setCity(location.display_name);
        setCoordinates([location.lat, location.lon]);
        setCustomPolygon(null);
        await loadData(location.lat, location.lon, amenity, radius, null);
      }
    } catch (error) { alert("Error searching city."); } 
    finally { setLoading(false); }
  };

  const handleAmenityChange = (newAmenity) => {
    setAmenity(newAmenity);
    loadData(coordinates[0], coordinates[1], newAmenity, radius, customPolygon);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if(!customPolygon) loadData(coordinates[0], coordinates[1], amenity, newRadius, null);
  };

  // Drawing
  const onShapeCreated = (e) => {
    const layer = e.layer;
    const coords = layer.getLatLngs()[0]; 
    setCustomPolygon(coords);
    loadData(coordinates[0], coordinates[1], amenity, radius, coords);
  };

  const onShapeDeleted = () => {
    setCustomPolygon(null);
    loadData(coordinates[0], coordinates[1], amenity, radius, null);
  };

  // Routing
  const handleMarkerClick = async (item, triggerRouting = false) => {
    if (triggerRouting && userLocation) {
        const destLat = item.lat || item.center.lat;
        const destLon = item.lon || item.center.lon;
        setLoading(true);
        const route = await fetchRoute(userLocation[0], userLocation[1], destLat, destLon);
        setRouteData(route);
        setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
  };

  // Filtering Handler (Passed to Analytics Panel)
  const handleCategorySelect = (categoryName) => {
    setCategoryFilter(categoryName);
  };

  const clearFilter = () => {
    setCategoryFilter(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <Sidebar 
        onSearch={handleCitySearch}
        onAmenityChange={handleAmenityChange}
        onRadiusChange={handleRadiusChange}
        onExport={() => {}}
        loading={loading}
        selectedAmenity={amenity}
        searchRadius={radius}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        toggleHeatmap={() => setShowHeatmap(!showHeatmap)}
        showHeatmap={showHeatmap}
        customPolygon={customPolygon}
      />

      <div className="flex-1 relative z-0">
        {loading && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
            Processing Data...
          </div>
        )}
        
        <MapComponent 
          center={coordinates} 
          data={filteredData} // Note: Passing filtered data here
          isHeatmapMode={showHeatmap}
          searchRadius={radius}
          userLocation={userLocation}
          customPolygon={customPolygon}
          onShapeCreated={onShapeCreated}
          onShapeDeleted={onShapeDeleted}
          onMarkerClick={handleMarkerClick}
          routeData={routeData}
          onClearRoute={clearRoute} // Pass clear function
        />
        
        {/* Helper UI */}
        {!customPolygon && !routeData && (
             <div className="absolute top-4 left-14 z-[400] bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
                Use toolbar (right) to draw search area.
            </div>
        )}
      </div>

      <div className="hidden md:block h-full">
        {/* Pass raw data for stats calculation, or filtered data? 
            Usually analytics shows the Filtered view. Passing filteredData ensures consistency. */}
        <AnalyticsPanel 
            data={filteredData} 
            amenity={amenity} 
            onCategoryClick={handleCategorySelect}
            activeFilter={categoryFilter}
            onClearFilter={clearFilter}
        />
      </div>
    </div>
  );
}

export default App;