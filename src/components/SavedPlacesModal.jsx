import React, { useEffect, useState } from 'react';
import { X, Star, Trash2, MapPin, Calendar, StickyNote, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSavedPlaces, deletePlace } from '../services/savedPlacesService';

const CATEGORIES = ['All', 'Important', 'Favorites', 'Visited', 'Want to Visit', 'Other'];

const SavedPlacesModal = ({ isOpen, onClose, onPlaceClick }) => {
  const { user } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    if (isOpen && user) {
      loadSavedPlaces();
    }
  }, [isOpen, user]);

  const loadSavedPlaces = async () => {
    setLoading(true);
    try {
      const places = await getSavedPlaces(user.id);
      setSavedPlaces(places);
    } catch (error) {
      console.error('Error loading saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (placeId) => {
    if (!window.confirm('Delete this saved place?')) return;
    
    try {
      await deletePlace(placeId);
      setSavedPlaces(prev => prev.filter(p => p.id !== placeId));
    } catch (error) {
      alert('Failed to delete place');
    }
  };

  const handlePlaceClick = (place) => {
    onPlaceClick([place.lat, place.lon], place);
    onClose();
  };

  if (!isOpen) return null;

  const filteredPlaces = categoryFilter === 'All' 
    ? savedPlaces 
    : savedPlaces.filter(p => p.category === categoryFilter);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[85vh] rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star className="text-yellow-500" size={24} />
              Saved Places
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {savedPlaces.length} / 50 places saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={16} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({savedPlaces.filter(p => p.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Star className="text-gray-300 dark:text-gray-600 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {categoryFilter === 'All' ? 'No saved places yet' : `No places in "${categoryFilter}"`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {categoryFilter === 'All' 
                  ? 'Click on any location on the map and save it to your collection!'
                  : 'Try selecting a different category above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <button
                        onClick={() => handlePlaceClick(place)}
                        className="flex-1 text-left group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                      >
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                          {place.place_name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {place.amenity_type}
                        </p>
                      </button>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded ml-2 flex-shrink-0">
                        {place.category}
                      </span>
                    </div>

                    {place.notes && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <StickyNote size={14} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {place.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(place.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(place.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition p-2 flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPlacesModal;