// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import AnalyticsPanel from './components/AnalyticsPanel';
import { searchCity, fetchAmenities, fetchRoute } from './api/osmService';

function App() {
  const [city, setCity] = useState('Orlando, FL');
  const [coordinates, setCoordinates] = useState([28.5383, -81.3792]);

  // ⭐ 改成多个 amenity
  const [amenities, setAmenities] = useState(['restaurant']);

  const [radius, setRadius] = useState(1500);
  const [data, setData] = useState([]); // Raw data from OSM
  const [loading, setLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [customPolygon, setCustomPolygon] = useState(null);

  // Filtering
  const [categoryFilter, setCategoryFilter] = useState(null);

  // 当前选中的 POI（详情面板）
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log('Location access denied')
      );
    }
    // 初次加载用当前 amenities
    loadData(coordinates[0], coordinates[1], amenities, radius, null);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // 🎯 支持 amenity 数组
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

  // --- Derived State for Filtering ---
  const filteredData = categoryFilter
    ? data.filter((item) => {
        const cuisine = item.tags.cuisine || '';
        const religion = item.tags.religion || '';
        const type = item.tags['school:type'] || '';
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

  // ⭐ 多选 amenity：newAmenities 是 string[]
  const handleAmenityChange = (newAmenities) => {
    setAmenities(newAmenities);
    loadData(coordinates[0], coordinates[1], newAmenities, radius, customPolygon);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (!customPolygon) loadData(coordinates[0], coordinates[1], amenities, newRadius, null);
  };

  // Drawing
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

  // Routing + 选中地点
  const handleMarkerClick = async (item, triggerRouting = false) => {
    // 不管要不要路由，先记录选中
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

  // 给 Analytics 用的 label
  const amenityLabel =
    amenities.length === 1
      ? amenities[0].replace(/_/g, ' ')
      : `${amenities.length} layers`;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <Sidebar
        onSearch={handleCitySearch}
        onAmenityChange={handleAmenityChange}
        onRadiusChange={handleRadiusChange}
        onExport={() => {}}
        loading={loading}
        // ⭐ 传数组下去
        selectedAmenities={amenities}
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

        {/* Helper UI */}
        {!customPolygon && !routeData && (
          <div className="absolute top-4 left-14 z-[400] bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
            Use toolbar (right) to draw search area.
          </div>
        )}

        {/* 详情面板 */}
        {selectedPlace && (
          <div
            className="
              absolute bottom-4 left-4 right-4
              md:left-auto md:right-4 md:w-80
              z-[600]
              bg-white dark:bg-gray-900
              rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
              p-4
            "
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm md:text-base">
                {selectedPlace.tags?.name || 'Unnamed place'}
              </h3>
              <button
                onClick={clearSelectedPlace}
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                ✕
              </button>
            </div>

            {(selectedPlace.tags?.amenity || selectedPlace.tags?.cuisine) && (
              <p className="text-xs text-gray-500 mb-1">
                {selectedPlace.tags?.amenity}
                {selectedPlace.tags?.cuisine && ` · ${selectedPlace.tags.cuisine}`}
              </p>
            )}

            {(selectedPlace.tags?.['addr:housenumber'] ||
              selectedPlace.tags?.['addr:street'] ||
              selectedPlace.tags?.['addr:city']) && (
              <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
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
              <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                ☎ {selectedPlace.tags.phone}
              </p>
            )}

            {selectedPlace.tags?.opening_hours && (
              <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                ⏰ {selectedPlace.tags.opening_hours}
              </p>
            )}

            {selectedPlace.tags?.wheelchair && (
              <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                ♿ Wheelchair: {selectedPlace.tags.wheelchair}
              </p>
            )}

            {(selectedPlace.tags?.brand || selectedPlace.tags?.operator) && (
              <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                🏷 {selectedPlace.tags?.brand || selectedPlace.tags?.operator}
              </p>
            )}

            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Show raw OSM tags
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto text-[10px] bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {JSON.stringify(selectedPlace.tags, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="hidden md:block h-full">
        <AnalyticsPanel
          data={filteredData}
          // ⭐ 改成 amenityLabel
          amenityLabel={amenityLabel}
          onCategoryClick={handleCategorySelect}
          activeFilter={categoryFilter}
          onClearFilter={clearFilter}
        />
      </div>
    </div>
  );
}

export default App;
