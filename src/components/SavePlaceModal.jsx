import React, { useState } from 'react';
import { X, Star, Save } from 'lucide-react';

const CATEGORIES = ['Important', 'Favorites', 'Visited', 'Want to Visit', 'Other'];

const SavePlaceModal = ({ isOpen, onClose, place, onSave }) => {
  const [category, setCategory] = useState('Favorites');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !place) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        category,
        notes: notes.trim()
      });
      onClose();
      setNotes('');
      setCategory('Favorites');
    } catch (error) {
      alert('Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Star className="text-yellow-500" size={24} />
            Save Place
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Place Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
              {place.tags?.name || 'Unnamed Place'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {place.tags?.amenity || 'Unknown type'}
              {place.tags?.cuisine && ` • ${place.tags.cuisine}`}
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-2 text-sm font-medium rounded-lg border-2 transition ${
                    category === cat
                      ? 'border-blue-600 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes about this place..."
              maxLength={200}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
              {notes.length}/200 characters
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Place
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePlaceModal;