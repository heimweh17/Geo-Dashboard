import axios from 'axios';
import { API_BASE } from '../lib/api';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

export const searchCity = async (cityName) => {
  const response = await axios.get(`${API_BASE}/osm/cities`, {
    params: { query: cityName },
  });
  return response.data;
};

// Fetches data. 
// If `polygonCoords` is provided, it uses a polygon query.
// If not, it uses a standard radius query.
export const fetchAmenities = async (lat, lon, amenities, radius, polygonCoords = null) => {
  // 支持 string 或 array
  const list = Array.isArray(amenities) ? amenities : [amenities];
  try {
    const response = await axios.post(`${API_BASE}/osm/amenities`, {
      lat,
      lon,
      amenities: list,
      radius,
      polygon: polygonCoords,
    });
    return response.data.elements;
  } catch (error) {
    console.error('Error fetching amenities:', error);
    throw error;
  }
};

// Fetch route from User -> Destination using OSRM (Open Source Routing Machine)
export const fetchRoute = async (startLat, startLon, endLat, endLon, mode = 'driving') => {
  // mode can be 'driving', 'walking', 'cycling'
  try {
    const url = `${OSRM_BASE_URL}/${mode}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
    const response = await axios.get(url);
    
    if (response.data.routes && response.data.routes.length > 0) {
      // Returns GeoJSON coordinates of the path [ [lon, lat], ... ]
      const coordinates = response.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // Swap to [lat, lon]
      return { 
        coordinates, 
        distance: response.data.routes[0].distance, // Meters
        duration: response.data.routes[0].duration  // Seconds
      };
    }
    return null;
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
};
