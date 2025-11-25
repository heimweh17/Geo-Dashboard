import React, { useState } from 'react';
import { Search, Map, Moon, Sun, Download, Layers, X, Github, Mail, Globe } from 'lucide-react';

const AMENITIES = [
  'restaurant', 'cafe', 'bar', 'fast_food',
  'pub', 'parking', 'fuel', 'cinema', 
  'bank', 'pharmacy', 'hospital', 'school',
  'university', 'library', 'place_of_worship'
];

const Sidebar = ({ 
  onSearch, 
  onAmenityChange, 
  onRadiusChange,
  onExport,
  loading, 
  selectedAmenity,
  searchRadius,
  toggleTheme,
  isDarkMode,
  toggleHeatmap,
  showHeatmap,
  customPolygon
}) => {
  const [cityInput, setCityInput] = useState('');
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) onSearch(cityInput);
  };

  return (
    <>
      <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto transition-colors duration-300 shadow-xl z-20 relative">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Map size={24} />
              GeoAnalytica
            </h1>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <form onSubmit={handleSearch} className="mb-6 relative">
            <input
              type="text"
              placeholder="Search city (e.g. Miami)..."
              className="w-full p-3 pl-10 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          </form>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amenity Type</label>
              <select 
                value={selectedAmenity} 
                onChange={(e) => onAmenityChange(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                {AMENITIES.map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${customPolygon ? 'bg-gray-200' : 'bg-blue-200'}`}
              />
              {customPolygon && <p className="text-xs text-orange-500 mt-1">Radius disabled (Using Custom Area)</p>}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={toggleHeatmap}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
                  showHeatmap 
                    ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' 
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <Layers size={18} />
                {showHeatmap ? 'Heatmap Active' : 'Show Heatmap'}
              </button>

              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-6 text-xs text-gray-500 dark:text-gray-400 text-center border-t dark:border-gray-800">
          <p className="mb-1">Data © OpenStreetMap contributors</p>
          <p>
            Made by{' '}
            <button 
              onClick={() => setShowAuthorModal(true)} 
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Alex Liu
            </button>
          </p>
        </div>
      </div>

      {/* AUTHOR MODAL */}
      {showAuthorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm relative p-6 border dark:border-gray-700">
            <button 
              onClick={() => setShowAuthorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                AL
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Alex Liu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Full Stack Developer & Geo-Data Enthusiast</p>
              
              <div className="space-y-4 text-left">
                <a href="mailto:haozhouliu17@gmail.com" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <Mail className="text-blue-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-200">haozhouliu17@gmail.com</span>
                </a>
                
                <a href="https://github.com/heimweh17" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <Github className="text-gray-800 dark:text-white" size={20} />
                  <span className="text-gray-700 dark:text-gray-200">github.com/heimweh17</span>
                </a>
                
                <a href="https://aliu.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <Globe className="text-green-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-200">aliu.me</span>
                </a>
              </div>

              
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;