import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  FeatureGroup,
  Polyline,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet.heat';

// ====== ICONS ======
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const UserIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const createColoredIcon = (color) =>
  L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

// amenity -> icon 映射
const AMENITY_ICON_MAP = {
  restaurant: createColoredIcon('red'),
  cafe: createColoredIcon('blue'),
  bar: createColoredIcon('orange'),
  fast_food: createColoredIcon('yellow'),
  pub: createColoredIcon('violet'),
  hospital: createColoredIcon('green'),
  pharmacy: createColoredIcon('green'),
  school: createColoredIcon('orange'),
  university: createColoredIcon('blue'),
  library: createColoredIcon('violet'),
  parking: createColoredIcon('blue'),
  fuel: createColoredIcon('orange'),
  bank: createColoredIcon('green'),
  place_of_worship: createColoredIcon('violet'),
};

// ====== HELPERS ======
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center)) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  return null;
};

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;
    const heat = L.heatLayer(points, { radius: 25, blur: 15 }).addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [points, map]);
  return null;
};

// ====== MAIN COMPONENT ======
const MapComponent = ({
  center,
  data,
  isHeatmapMode,
  searchRadius,
  onShapeCreated,
  onShapeDeleted,
  customPolygon,
  userLocation,
  onMarkerClick,
  routeData,
  onClearRoute,
}) => {
  const safeData = Array.isArray(data) ? data : [];

  const heatPoints = safeData
    .map((item) => {
      const lat = item.lat ?? item.center?.lat;
      const lon = item.lon ?? item.center?.lon;
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;
      return [lat, lon, 1];
    })
    .filter(Boolean);

  const featureGroupRef = useRef(null);

  // 清理画的区域（比如重新搜索城市时）
  useEffect(() => {
    if (!customPolygon && featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  }, [customPolygon]);

  const handleCreated = (e) => {
    const layer = e.layer;
    if (featureGroupRef.current) {
      const layers = featureGroupRef.current.getLayers();
      if (layers.length > 1) {
        layers.forEach((l) => {
          if (l !== layer) featureGroupRef.current.removeLayer(l);
        });
      }
    }
    onShapeCreated(e);
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OSM"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater center={center} />

        {/* DRAWING CONTROLS */}
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onDeleted={onShapeDeleted}
            draw={{
              rectangle: false,
              polygon: true,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
            }}
          />
        </FeatureGroup>

        {/* SEARCH RADIUS */}
        {!customPolygon && center && (
          <Circle
            center={center}
            radius={searchRadius}
            pathOptions={{
              color: 'blue',
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '5, 5',
            }}
          />
        )}

        {/* USER LOCATION */}
        {userLocation && Array.isArray(userLocation) && (
          <Marker position={userLocation} icon={UserIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* ROUTE LINE */}
        {routeData && routeData.coordinates && (
          <Polyline
            positions={routeData.coordinates}
            color="red"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* HEATMAP / MARKERS */}
        {isHeatmapMode ? (
          <HeatmapLayer points={heatPoints} />
        ) : (
          safeData.map((item) => {
            const tags = item.tags || {};
            const lat = item.lat ?? item.center?.lat;
            const lon = item.lon ?? item.center?.lon;

            if (typeof lat !== 'number' || typeof lon !== 'number') {
              // 数据如果没有坐标，就跳过这条，避免崩
              return null;
            }

            const amenityType = tags.amenity;
            const markerIcon = AMENITY_ICON_MAP[amenityType] || DefaultIcon;

            return (
              <Marker
                key={item.id}
                position={[lat, lon]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => onMarkerClick(item, false),
                }}
              >
                <Popup>
                  <div className="font-sans min-w-[150px]">
                    <h3 className="font-bold text-base">
                      {tags.name || 'Unnamed'}
                    </h3>
                    {tags.cuisine && (
                      <p className="text-xs uppercase text-gray-500 mb-1">
                        {tags.cuisine}
                      </p>
                    )}
                    <button
                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-2 rounded transition"
                      onClick={() => onMarkerClick(item, true)}
                    >
                      🚗 Get Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>

      {/* ROUTE INFO BOX */}
      {routeData && (
        <div className="absolute bottom-6 right-4 z-[1000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border-l-4 border-blue-500 w-64 animate-fade-in-up">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 dark:text-white">Trip Info</h4>
            <button
              onClick={onClearRoute}
              className="text-gray-400 hover:text-red-500 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>🚗 Drive Time:</span>
            <span className="font-mono font-bold">
              {Math.round(routeData.duration / 60)} min
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span>📏 Distance:</span>
            <span className="font-mono font-bold">
              {(routeData.distance / 1000).toFixed(1)} km
            </span>
          </div>
          <button
            onClick={onClearRoute}
            className="w-full mt-3 bg-red-100 text-red-700 text-xs py-1 rounded hover:bg-red-200"
          >
            Clear Route
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
