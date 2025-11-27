import { supabase } from '../lib/supabaseClient';

/**
 * Save a place to user's collection
 */
export const savePlace = async (placeData) => {
  const { data, error } = await supabase
    .from('saved_places')
    .insert([placeData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get all saved places for current user
 */
export const getSavedPlaces = async (userId) => {
  const { data, error } = await supabase
    .from('saved_places')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

/**
 * Delete a saved place
 */
export const deletePlace = async (placeId) => {
  const { error } = await supabase
    .from('saved_places')
    .delete()
    .eq('id', placeId);
  
  if (error) throw error;
};

/**
 * Update a saved place (notes, category)
 */
export const updatePlace = async (placeId, updates) => {
  const { data, error } = await supabase
    .from('saved_places')
    .update(updates)
    .eq('id', placeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Check if place is already saved
 */
export const isPlaceSaved = async (userId, lat, lon) => {
  const { data, error } = await supabase
    .from('saved_places')
    .select('id')
    .eq('user_id', userId)
    .eq('lat', lat)
    .eq('lon', lon)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};