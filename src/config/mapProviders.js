const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const readUrl = (value, fallback) => {
  if (!value || !value.trim()) return fallback;
  return trimTrailingSlash(value.trim());
};

const defaultCartoTileUrl =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

const addCartoApiKey = (url) => {
  const apiKey = import.meta.env.VITE_CARTO_API_KEY?.trim();
  if (!apiKey || !url.includes('basemaps.cartocdn.com')) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${encodeURIComponent(apiKey)}`;
};

export const MAP_TILE_URL = addCartoApiKey(
  import.meta.env.VITE_MAP_TILE_URL || defaultCartoTileUrl
);

export const MAP_TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const NOMINATIM_BASE_URL = readUrl(
  import.meta.env.VITE_NOMINATIM_BASE_URL,
  'https://nominatim.openstreetmap.org/search'
);

export const OVERPASS_API_URL = readUrl(
  import.meta.env.VITE_OVERPASS_API_URL,
  'https://overpass-api.de/api/interpreter'
);

export const OSRM_BASE_URL = readUrl(
  import.meta.env.VITE_OSRM_BASE_URL,
  'https://router.project-osrm.org/route/v1'
);
