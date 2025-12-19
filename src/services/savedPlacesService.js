import { listPlaces, createPlace, updatePlace, deletePlace as deletePlaceAPI } from '../lib/api';

/**
 * Get auth token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('geo_token');
};

/**
 * Save a place to user's collection
 */
export const savePlace = async (placeData) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  return createPlace(token, placeData);
};

/**
 * Get all saved places for current user
 */
export const getSavedPlaces = async (userId) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  const places = await listPlaces(token);
  return places;
};

/**
 * Delete a saved place
 */
export const deletePlace = async (placeId) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  await deletePlaceAPI(token, placeId);
};

/**
 * Update a saved place (notes, category)
 */
export const updatePlaceData = async (placeId, updates) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  return updatePlace(token, placeId, updates);
};

/**
 * Check if place is already saved (by lat/lon)
 */
export const isPlaceSaved = async (userId, lat, lon) => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const places = await listPlaces(token);
    return places.some(p => 
      Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lon - lon) < 0.0001
    );
  } catch {
    return false;
  }
};