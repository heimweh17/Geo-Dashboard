// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import AnalyticsPanel from './components/AnalyticsPanel';
import { searchCity, fetchAmenities, fetchRoute } from './api/osmService';
import { Menu, X } from 'lucide-react'; // Import icons

function App() {
  const [city, setCity] = useState('Orlando, FL');
  const [coordinates, setCoordinates] = useState([28.5383, -81.3792]);
  const [amenities, setAmenities] = useState(['restaurant']);
  const [radius, setRadius] = useState(1500);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [customPolygon, setCustomPolygon] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Mobile sidebar toggle states
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log('Location access denied')
      );
    }
    loadData(coordinates[0], coordinates[1], amenities, radius, null);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0c1e3e';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f1f5f9';
    }
  }, [isDarkMode]);

  const loadData = async (lat, lon, amenityList, rad, poly = null) => {
    setLoading(true);
    setData([]);
    setRouteData(null);
    setCategoryFilter(null);
    setSelectedPlace(null);

    try {
      const results = await fetchAmenities(lat, lon, amenityList, rad, poly);
      setData(results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = categoryFilter
    ? data.filter((item) => {
        const tags = item.tags || {};
        
        if (tags.amenity && tags.amenity.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        const cuisine = tags.cuisine || '';
        if (cuisine.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        const religion = tags.religion || '';
        if (religion.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        const schoolType = tags['school:type'] || '';
        if (schoolType.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        return false;
      })
    : data;

  const handleCitySearch = async (cityName) => {
    setLoading(true);
    setCategoryFilter(null);
    setData([]);
    setRouteData(null);
    setSelectedPlace(null);
    try {
      const location = await searchCity(cityName);
      if (location) {
        setCity(location.display_name);
        setCoordinates([location.lat, location.lon]);
        setCustomPolygon(null);
        await loadData(location.lat, location.lon, amenities, radius, null);
      }
    } catch (error) {
      alert('Error searching city.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityChange = (newAmenities) => {
    setAmenities(newAmenities);
    loadData(coordinates[0], coordinates[1], newAmenities, radius, customPolygon);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (!customPolygon) loadData(coordinates[0], coordinates[1], amenities, newRadius, null);
  };

  const onShapeCreated = (e) => {
    const layer = e.layer;
    const coords = layer.getLatLngs()[0];
    setCustomPolygon(coords);
    setSelectedPlace(null);
    loadData(coordinates[0], coordinates[1], amenities, radius, coords);
  };

  const onShapeDeleted = () => {
    setCustomPolygon(null);
    setSelectedPlace(null);
    loadData(coordinates[0], coordinates[1], amenities, radius, null);
  };

  const handleMarkerClick = async (item, triggerRouting = false) => {
    setSelectedPlace(item);

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

  const handleCategorySelect = (categoryName) => {
    setCategoryFilter(categoryName);
  };

  const clearFilter = () => {
    setCategoryFilter(null);
  };

  const clearSelectedPlace = () => {
    setSelectedPlace(null);
  };

  const amenityLabel =
    amenities.length === 1
      ? amenities[0].replace(/_/g, ' ')
      : `${amenities.length} layers`;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 font-sans">
      
      {/* Mobile Toggle Buttons - Only visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 right-4 z-[1000] flex justify-between gap-2">
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          {showLeftSidebar ? <X size={20} /> : <Menu size={20} />}
          <span className="text-sm font-semibold">Controls</span>
        </button>
        
        <button
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span className="text-sm font-semibold">Analytics</span>
          {showRightSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Left Sidebar - Hidden on mobile by default, shown when toggled */}
      <div className={`
        fixed md:relative
        inset-y-0 left-0
        z-[999]
        w-full md:w-80
        transform transition-transform duration-300 ease-in-out
        ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          onSearch={handleCitySearch}
          onAmenityChange={handleAmenityChange}
          onRadiusChange={handleRadiusChange}
          onExport={() => {}}
          loading={loading}
          selectedAmenities={amenities}
          searchRadius={radius}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          isDarkMode={isDarkMode}
          toggleHeatmap={() => setShowHeatmap(!showHeatmap)}
          showHeatmap={showHeatmap}
          customPolygon={customPolygon}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        {loading && (
          <div className="absolute inset-0 bg-blue-900/80 z-50 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
            <div className="bg-blue-800 border border-blue-600 p-6 rounded-md text-center">
              <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              Processing Data...
            </div>
          </div>
        )}

        <MapComponent
          center={coordinates}
          data={filteredData}
          isHeatmapMode={showHeatmap}
          searchRadius={radius}
          userLocation={userLocation}
          customPolygon={customPolygon}
          onShapeCreated={onShapeCreated}
          onShapeDeleted={onShapeDeleted}
          onMarkerClick={handleMarkerClick}
          routeData={routeData}
          onClearRoute={clearRoute}
        />

        {!customPolygon && !routeData && (
          <div className="hidden md:block absolute top-4 left-14 z-[400] bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 p-3 shadow text-xs rounded-md">
            <div className="text-blue-900 dark:text-blue-100 font-medium">
              Use toolbar (right) to draw search area
            </div>
          </div>
        )}

        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[600] bg-white dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 shadow-2xl p-4 rounded-md">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm md:text-base text-blue-900 dark:text-blue-100">
                {selectedPlace.tags?.name || 'Unnamed place'}
              </h3>
              <button
                onClick={clearSelectedPlace}
                className="text-blue-500 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>
            {(selectedPlace.tags?.amenity || selectedPlace.tags?.cuisine) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                {selectedPlace.tags?.amenity}
                {selectedPlace.tags?.cuisine && ` · ${selectedPlace.tags.cuisine}`}
              </p>
            )}
            {(selectedPlace.tags?.['addr:housenumber'] ||
              selectedPlace.tags?.['addr:street'] ||
              selectedPlace.tags?.['addr:city']) && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                📍
                {[
                  selectedPlace.tags?.['addr:housenumber'],
                  selectedPlace.tags?.['addr:street'],
                  selectedPlace.tags?.['addr:city'],
                ]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            )}
            {selectedPlace.tags?.phone && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                ☎ {selectedPlace.tags.phone}
              </p>
            )}
            {selectedPlace.tags?.opening_hours && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                ⏰ {selectedPlace.tags.opening_hours}
              </p>
            )}
            {selectedPlace.tags?.wheelchair && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                ♿ Wheelchair: {selectedPlace.tags.wheelchair}
              </p>
            )}
            {(selectedPlace.tags?.brand || selectedPlace.tags?.operator) && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                🏷 {selectedPlace.tags?.brand || selectedPlace.tags?.operator}
              </p>
            )}
            <details className="mt-2">
              <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer font-medium">
                Show raw OSM tags
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto text-[10px] bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 p-2 rounded-md">
                {JSON.stringify(selectedPlace.tags, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Right Sidebar (Analytics) - Hidden on mobile by default */}
      <div className={`
        fixed md:relative
        inset-y-0 right-0
        z-[999]
        w-full md:w-80
        transform transition-transform duration-300 ease-in-out
        ${showRightSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <AnalyticsPanel
          data={filteredData}
          amenityLabel={amenityLabel}
          onCategoryClick={handleCategorySelect}
          activeFilter={categoryFilter}
          onClearFilter={clearFilter}
          searchRadius={radius}
          customPolygon={customPolygon}
        />
      </div>

      {/* Overlay when sidebars are open on mobile */}
      {(showLeftSidebar || showRightSidebar) && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[998]"
          onClick={() => {
            setShowLeftSidebar(false);
            setShowRightSidebar(false);
          }}
        />
      )}
    </div>
  );
}

export default App;