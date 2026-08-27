const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY?.trim();

const cartoTileUrl =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const openStreetMapTileUrl =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// CARTO now requires a key. Keep the map available with OSM until one is configured.
export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  (cartoApiKey
    ? `${cartoTileUrl}?key=${encodeURIComponent(cartoApiKey)}`
    : openStreetMapTileUrl);

export const MAP_TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
  (cartoApiKey
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors');
