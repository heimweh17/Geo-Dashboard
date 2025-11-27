import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Map, Moon, Sun, Download, Layers, X, Github, Mail, Globe, TrendingUp, ChevronDown, User, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ComparisonModal from './ComparisonModal';
import LoginModal from './LoginModal';
import ProfileModal from './ProfileModal';

const DATA_LAYERS = [
  'restaurant', 'cafe', 'bar', 'fast_food', 'pub', 'cinema', 'hospital', 'clinic',
  'pharmacy', 'dentist', 'school', 'university', 'library', 'bank', 'atm', 'shop',
  'mall', 'supermarket', 'gym', 'parking', 'fuel', 'police', 'fire_station', 'hotel',
  'post_office', 'bus_station'
];

const Sidebar = ({ 
  onSearch, 
  onAmenityChange, 
  onRadiusChange,
  onExport,
  loading, 
  selectedAmenities,
  searchRadius,
  toggleTheme,
  isDarkMode,
  toggleHeatmap,
  showHeatmap,
  customPolygon,
  onShowSavedPlaces
}) => {
  const { user } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) onSearch(cityInput);
  };

  const toggleAmenity = (amenity) => {
    let next;
    if (selectedAmenities.includes(amenity)) {
      next = selectedAmenities.filter((x) => x !== amenity);
      if (next.length === 0) next = [amenity];
    } else {
      next = [...selectedAmenities, amenity];
    }
    onAmenityChange(next);
  };

  const selectAllAmenities = () => {
    onAmenityChange([...DATA_LAYERS]);
  };

  const clearAllAmenities = () => {
    onAmenityChange(['restaurant']);
  };

  return (
    <>
      {/* SIDEBAR CONTENT */}
      <div className="w-full md:w-80 bg-white dark:bg-blue-950 border-r border-blue-200 dark:border-blue-800 flex flex-col h-full overflow-y-auto transition-colors duration-300 shadow-xl relative">
        <div className="p-6">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Map size={24} />
              GeoAnalytica
            </h1>
            <button 
              onClick={toggleTheme} 
              className="p-2 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors rounded-md"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Auth Section */}
          <div className="mb-6 pb-4 border-b border-blue-200 dark:border-blue-700">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onShowSavedPlaces}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  <Star size={18} />
                  Saved
                </button>
                
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  <User size={18} />
                  Profile
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                <User size={18} />
                Sign In / Sign Up
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6 relative">
            <input
              type="text"
              placeholder="Search city (e.g. Miami)..."
              className="w-full p-3 pl-10 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-600 outline-none rounded-md"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 text-blue-500" size={18} />
          </form>

          <div className="space-y-6">
            
            {/* Data Layers Dropdown */}
            <div>
              <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                Data Layers ({selectedAmenities.length} selected)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full p-3 border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100 flex items-center justify-between rounded-md hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors"
                >
                  <span className="text-sm">
                    {selectedAmenities.length === 1 
                      ? selectedAmenities[0].replace(/_/g, ' ')
                      : `${selectedAmenities.length} layers selected`
                    }
                  </span>
                  <ChevronDown size={16} className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-blue-900 border border-blue-300 dark:border-blue-700 shadow-lg z-50 max-h-80 overflow-y-auto rounded-md">
                    <div className="p-3 border-b border-blue-200 dark:border-blue-700 flex gap-2">
                      <button
                        onClick={selectAllAmenities}
                        className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllAmenities}
                        className="px-3 py-1 text-xs bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors rounded-md"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {DATA_LAYERS.map((amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center gap-2 p-2 hover:bg-blue-50 dark:hover:bg-blue-800 cursor-pointer rounded-md transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="w-4 h-4 text-blue-600 border-blue-300 focus:ring-blue-500 rounded"
                          />
                          <span className="text-sm text-blue-900 dark:text-blue-100 capitalize">
                            {amenity.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedAmenities.slice(0, 6).map((amenity) => (
                  <span
                    key={amenity}
                    className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-md font-medium"
                  >
                    {amenity.replace(/_/g, ' ')}
                  </span>
                ))}
                {selectedAmenities.length > 6 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-md">
                    +{selectedAmenities.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Search Radius */}
            <div>
              <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                Search Radius: {searchRadius / 1000} km
              </label>
              <input 
                type="range" 
                min="1000" 
                max="20000" 
                step="500" 
                value={searchRadius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                disabled={!!customPolygon}
                className={`w-full h-2 appearance-none cursor-pointer rounded-sm ${
                  customPolygon 
                    ? 'bg-gray-300 dark:bg-gray-600' 
                    : 'bg-blue-200 dark:bg-blue-800'
                }`}
                style={{
                  background: customPolygon 
                    ? undefined 
                    : `linear-gradient(to right, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)`
                }}
              />
              {customPolygon && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Radius disabled (Using Custom Area)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={toggleHeatmap}
                className={`flex items-center justify-center gap-2 p-3 border transition-colors rounded-md ${
                  showHeatmap 
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300' 
                    : 'bg-white dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800'
                }`}
              >
                <Layers size={18} />
                {showHeatmap ? 'Heatmap Active' : 'Show Heatmap'}
              </button>

              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 p-3 bg-green-700 dark:bg-green-800 text-white hover:bg-green-800 dark:hover:bg-green-700 transition-colors rounded-md border border-green-600"
                disabled={loading}
              >
                <Download size={18} />
                Export Data
              </button>
              
              <button
                onClick={() => setShowComparisonModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-blue-700 dark:bg-blue-800 text-white hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors rounded-md border border-blue-600"
              >
                <TrendingUp size={18} />
                Compare Cities
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-auto p-6 text-xs text-blue-600 dark:text-blue-400 text-center border-t border-blue-200 dark:border-blue-800">
          <p className="mb-1">Data © OpenStreetMap contributors</p>
          <p>
            Made by{' '}
            <button 
              onClick={() => setShowAuthorModal(true)} 
              className="text-blue-700 dark:text-blue-300 font-bold hover:underline"
            >
              Alex Liu
            </button>
          </p>
        </div>
      </div>

      {/* MODALS RENDERED TO DOCUMENT.BODY USING PORTAL */}
      {createPortal(
        <>
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
          />

          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
          />

          {showAuthorModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 shadow-2xl w-full max-w-sm relative p-6 rounded-md">
                <button 
                  onClick={() => setShowAuthorModal(false)}
                  className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  <X size={24} />
                </button>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-2 border-blue-400 dark:border-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold rounded-md">
                    AL
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">Alex Liu</h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-6">Full Stack Developer & GIS Analyst</p>
                  
                  <div className="space-y-4 text-left">
                    <a 
                      href="mailto:haozhouliu17@gmail.com" 
                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition rounded-md"
                    >
                      <Mail className="text-blue-600" size={20} />
                      <span className="text-blue-800 dark:text-blue-200">haozhouliu17@gmail.com</span>
                    </a>
                    
                    <a 
                      href="https://github.com/heimweh17" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition rounded-md"
                    >
                      <Github className="text-blue-800 dark:text-blue-200" size={20} />
                      <span className="text-blue-800 dark:text-blue-200">github.com/heimweh17</span>
                    </a>
                    
                    <a 
                      href="https://aliu.me" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition rounded-md"
                    >
                      <Globe className="text-green-600" size={20} />
                      <span className="text-blue-800 dark:text-blue-200">aliu.me</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ComparisonModal
            isOpen={showComparisonModal}
            onClose={() => setShowComparisonModal(false)}
          />
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;