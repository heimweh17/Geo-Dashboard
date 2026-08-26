const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const readUrl = (value, fallback) => {
  if (!value || !value.trim()) return fallback;
  return trimTrailingSlash(value.trim());
};

export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const MAP_TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '&copy; OSM';

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
