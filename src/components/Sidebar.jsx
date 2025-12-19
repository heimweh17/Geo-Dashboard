import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Map, Moon, Sun, Download, Layers, X, Github, Mail, Globe, TrendingUp, ChevronDown, User, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import AnalysisResultsModal from './AnalysisResultsModal';
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
  const { user, token, isAuthed, signOut } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Upload / Analysis state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null); // { dataset_id, n_points, ... }
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [uploadedPoints, setUploadedPoints] = useState([]);
  const [gridCellSize, setGridCellSize] = useState(0.01);
  const [dbscanEpsKm, setDbscanEpsKm] = useState(1.0);
  const [dbscanMinSamples, setDbscanMinSamples] = useState(5);
  const [categoryField, setCategoryField] = useState('category');

  const handleUploadClick = () => {
    const input = document.getElementById('hidden-upload-input');
    if (input) input.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAuthed || !token) {
      setUploadError('Please login first, then refresh the page.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setAnalysisResult(null);
    setIsAnalysisModalOpen(false);
    try {
      // Parse points client-side for modal map
      const pts = await parseFileToPoints(file);
      setUploadedPoints(pts);

      const data = await api.uploadDataset(token, file);
      setDatasetInfo(data);
    } catch (err) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRunAnalysis = async () => {
    if (!datasetInfo?.dataset_id) return;
    if (!isAuthed || !token) {
      setAnalysisError('Please login first, then refresh the page.');
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const params = {
        grid_cell_size: Number(gridCellSize),
        dbscan_eps_km: Number(dbscanEpsKm),
        dbscan_eps: null,
        dbscan_min_samples: Number(dbscanMinSamples),
        category_field: categoryField || 'category',
      };
      const run = await api.analyzeDataset(token, datasetInfo.dataset_id, params);
      const parsed = typeof run.result_json === 'string' ? safeParseJSON(run.result_json) : run.result_json;
      setAnalysisResult(parsed || run.result_json);
      // Open modal on success
      setIsAnalysisModalOpen(true);
    } catch (err) {
      setAnalysisError(err?.message || 'Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const safeParseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch (_) {
      return null;
    }
  };

  const parseFileToPoints = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const name = (file.name || '').toLowerCase();
          const text = reader.result;
          if (name.endsWith('.csv')) {
            resolve(parseCsvPoints(String(text)));
          } else {
            resolve(parseGeojsonPoints(String(text)));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const parseCsvPoints = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((h) => h.trim());
    const idx = normalizeLatLonKeys(header);
    if (!idx.lat || !idx.lon) return [];
    const catIdx = findCategoryKey(header);
    const points = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const get = (key) => {
        const pos = header.indexOf(key);
        return pos >= 0 ? cols[pos] : undefined;
      };
      const lat = parseFloat(get(idx.lat));
      const lon = parseFloat(get(idx.lon));
      if (!isFinite(lat) || !isFinite(lon)) continue;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      const category = catIdx ? get(catIdx) : undefined;
      points.push({ lat, lon, category: category || undefined });
    }
    return points;
  };

  const normalizeLatLonKeys = (headers) => {
    const lower = headers.map((h) => h.trim().toLowerCase());
    const map = {};
    const latC = ['lat', 'latitude', 'y'];
    const lonC = ['lon', 'lng', 'long', 'longitude', 'x'];
    for (let i = 0; i < lower.length; i++) {
      if (latC.includes(lower[i]) && !map.lat) map.lat = headers[i];
      if (lonC.includes(lower[i]) && !map.lon) map.lon = headers[i];
    }
    return map;
  };

  const findCategoryKey = (headers) => {
    const lower = headers.map((h) => h.trim().toLowerCase());
    const idx = lower.indexOf('category');
    return idx >= 0 ? headers[idx] : null;
  };

  const splitCsvLine = (line) => {
    // Simple CSV splitter; assumes no escaped commas within quotes for MVP
    // Works for common simple CSVs; not a full CSV parser to keep deps minimal
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' ) {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts.map((p) => p.trim().replace(/^"|"$/g, ''));
  };

  const parseGeojsonPoints = (text) => {
    try {
      const data = JSON.parse(text);
      if (data.type !== 'FeatureCollection') return [];
      const feats = Array.isArray(data.features) ? data.features : [];
      const pts = [];
      for (const f of feats) {
        const g = f.geometry || {};
        if (g.type !== 'Point') continue;
        const coords = g.coordinates || [];
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const lon = Number(coords[0]);
        const lat = Number(coords[1]);
        if (!isFinite(lat) || !isFinite(lon)) continue;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
        const category = f.properties?.category;
        pts.push({ lat, lon, category });
      }
      return pts;
    } catch {
      return [];
    }
  };

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
              <>
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
                <button
                  onClick={signOut}
                  className="mt-2 w-full flex items-center justify-center gap-2 p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition rounded-md border border-blue-300 dark:border-blue-700"
                >
                  Logout
                </button>
              </>
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

              {/* Upload Dataset */}
              <input
                id="hidden-upload-input"
                type="file"
                accept=".csv,application/json,.geojson"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={handleUploadClick}
                className="flex items-center justify-center gap-2 p-3 bg-purple-700 dark:bg-purple-800 text-white hover:bg-purple-800 dark:hover:bg-purple-700 transition-colors rounded-md border border-purple-600 disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Dataset'}
              </button>
              {uploadError && (
                <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
              )}
              {datasetInfo && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-md text-sm text-blue-900 dark:text-blue-100">
                  <div><strong>Dataset ID:</strong> {datasetInfo.dataset_id}</div>
                  <div><strong>Points:</strong> {datasetInfo.n_points}</div>
                </div>
              )}

              {/* Analysis Panel */}
              {datasetInfo && (
                <div className="p-3 bg-white dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-blue-900 dark:text-blue-100">
                      Grid cell size
                      <input
                        type="number"
                        step="0.001"
                        value={gridCellSize}
                        onChange={(e) => setGridCellSize(e.target.value)}
                        className="w-full mt-1 p-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded-md"
                      />
                    </label>
                    <label className="text-xs text-blue-900 dark:text-blue-100">
                      DBSCAN eps (km)
                      <input
                        type="number"
                        step="0.1"
                        value={dbscanEpsKm}
                        onChange={(e) => setDbscanEpsKm(e.target.value)}
                        className="w-full mt-1 p-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded-md"
                      />
                    </label>
                    <label className="text-xs text-blue-900 dark:text-blue-100">
                      Min samples
                      <input
                        type="number"
                        min="1"
                        value={dbscanMinSamples}
                        onChange={(e) => setDbscanMinSamples(e.target.value)}
                        className="w-full mt-1 p-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded-md"
                      />
                    </label>
                    <label className="text-xs text-blue-900 dark:text-blue-100">
                      Category field
                      <input
                        type="text"
                        value={categoryField}
                        onChange={(e) => setCategoryField(e.target.value)}
                        className="w-full mt-1 p-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded-md"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleRunAnalysis}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-700 dark:bg-indigo-800 text-white hover:bg-indigo-800 dark:hover:bg-indigo-700 transition-colors rounded-md border border-indigo-600 disabled:opacity-60"
                    disabled={analysisLoading}
                  >
                    {analysisLoading ? 'Running Analysis...' : 'Run Analysis'}
                  </button>
                  {analysisError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{analysisError}</p>
                  )}

                  {analysisResult && (
                    <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-md p-2 text-blue-900 dark:text-blue-100 space-y-1">
                      <div><strong>Total points:</strong> {analysisResult?.summary?.total_points ?? '-'}</div>
                      <div><strong>BBox:</strong> {analysisResult?.summary?.bbox ? JSON.stringify(analysisResult.summary.bbox) : '-'}</div>
                      <div><strong>Mean center:</strong> {analysisResult?.summary?.mean_center ? JSON.stringify(analysisResult.summary.mean_center) : '-'}</div>
                      <div><strong>Category counts:</strong> {analysisResult?.summary?.category_counts ? JSON.stringify(analysisResult.summary.category_counts) : '-'}</div>
                      <div><strong>Clusters:</strong> {analysisResult?.clustering?.num_clusters ?? '-'}</div>
                      {Array.isArray(analysisResult?.clustering?.clusters) && analysisResult.clustering.clusters.length > 0 && (
                        <div className="max-h-24 overflow-y-auto">
                          {analysisResult.clustering.clusters.slice(0, 5).map((c) => (
                            <div key={c.cluster_id}>
                              #{c.cluster_id} size {c.size} centroid {JSON.stringify(c.centroid)}
                            </div>
                          ))}
                          {analysisResult.clustering.clusters.length > 5 && <div>… {analysisResult.clustering.clusters.length - 5} more</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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

          <AnalysisResultsModal
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            analysisResult={analysisResult}
            points={uploadedPoints}
            params={{
              grid_cell_size: Number(gridCellSize),
              dbscan_eps_km: Number(dbscanEpsKm),
              dbscan_min_samples: Number(dbscanMinSamples),
              category_field: categoryField || 'category',
            }}
          />
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;