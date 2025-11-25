import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

export const searchCity = async (cityName) => {
  const response = await axios.get(NOMINATIM_BASE_URL, {
    params: { q: cityName, format: 'json', limit: 1 },
  });
  if (response.data.length > 0) {
    return {
      lat: parseFloat(response.data[0].lat),
      lon: parseFloat(response.data[0].lon),
      display_name: response.data[0].display_name,
    };
  }
  return null;
};

// Fetches data. 
// If `polygonCoords` is provided, it uses a polygon query.
// If not, it uses a standard radius query.
export const fetchAmenities = async (lat, lon, amenity, radius, polygonCoords = null) => {
  let query = '';

  if (polygonCoords) {
    // Convert Leaflet lat objects {lat: x, lng: y} to Overpass string "lat lon lat lon..."
    const polyString = polygonCoords.map(p => `${p.lat} ${p.lng}`).join(' ');
    query = `
      [out:json][timeout:25];
      (
        node["amenity"="${amenity}"](poly:"${polyString}");
        way["amenity"="${amenity}"](poly:"${polyString}");
        relation["amenity"="${amenity}"](poly:"${polyString}");
      );
      out center;
    `;
  } else {
    query = `
      [out:json][timeout:25];
      (
        node["amenity"="${amenity}"](around:${radius},${lat},${lon});
        way["amenity"="${amenity}"](around:${radius},${lat},${lon});
        relation["amenity"="${amenity}"](around:${radius},${lat},${lon});
      );
      out center;
    `;
  }

  try {
    const response = await axios.post(OVERPASS_API_URL, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.elements;
  } catch (error) {
    console.error("Error fetching amenities:", error);
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