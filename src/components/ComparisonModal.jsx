import React, { useState, useEffect, useMemo } from 'react'; // Fixed: useEffec -> useEffect
import { 
  X, TrendingUp, MapPin, Layers, Activity, Download, 
  Database, BarChart3, Terminal
} from 'lucide-react';
import { searchCity, fetchAmenities } from '../api/osmService';
import {
  compareCityData,
  getTopCategories,
  interpretSpatialPattern,
  calculateCircleArea
} from '../utlis/gisAnalytics';
import {
  downloadComparisonCSV,
  downloadDetailedComparisonCSV,
  downloadComparisonJSON
} from '../utlis/exportUtils';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { generateComparativeInsights, calculateSimilarityScore } from '../utlis/generateInsights';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AMENITY_OPTIONS = [
  'restaurant', 'cafe', 'bar', 'fast_food', 'pub', 'cinema', 
  'hospital', 'clinic', 'pharmacy', 'dentist', 'school', 
  'university', 'library', 'bank', 'atm', 'shop', 'mall', 
  'supermarket', 'gym', 'parking', 'fuel', 'police', 
  'fire_station', 'hotel', 'post_office', 'bus_station'
];

const ComparisonModal = ({ isOpen, onClose }) => {
  const [city1Name, setCity1Name] = useState('');
  const [city2Name, setCity2Name] = useState('');
  const [radius, setRadius] = useState(5000);
  const [selectedAmenities, setSelectedAmenities] = useState(['restaurant']);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState(null);


  const insights = useMemo(() => {
    if (!comparisonData) return [];
    return generateComparativeInsights(comparisonData);
  }, [comparisonData]);

  const similarityScore = useMemo(() => {
    if (!comparisonData) return 0;
    return calculateSimilarityScore(comparisonData.city1, comparisonData.city2);
  }, [comparisonData]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenity)) {
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  const handleCompare = async () => {
    if (!city1Name.trim() || !city2Name.trim()) {
      setError('Please enter both city names');
      return;
    }

    setLoading(true);
    setError(null);
    setComparisonData(null);

    try {
      const loc1 = await searchCity(city1Name);
      const loc2 = await searchCity(city2Name);

      if (!loc1 || !loc2) {
        setError('Unable to locate cities. Please check spelling.');
        setLoading(false);
        return;
      }

      const data1 = await fetchAmenities(loc1.lat, loc1.lon, selectedAmenities, radius);
      const data2 = await fetchAmenities(loc2.lat, loc2.lon, selectedAmenities, radius);

      const analysis = compareCityData(data1, data2, radius);

      setComparisonData({
        city1: { 
          name: loc1.display_name, 
          coordinates: [parseFloat(loc1.lat), parseFloat(loc1.lon)], 
          data: data1,
          ...analysis.city1 
        },
        city2: { 
          name: loc2.display_name, 
          coordinates: [parseFloat(loc2.lat), parseFloat(loc2.lon)], 
          data: data2,
          ...analysis.city2 
        },
        comparison: analysis.comparison,
        amenities: selectedAmenities,
        metadata: {
          analysisDate: new Date().toISOString().split('T')[0],
          studyRadius: radius,
          dataPoints: data1.length + data2.length
        }
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-[98vw] max-h-[95vh] overflow-y-auto border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg">
        
        {/* Header */}
        <div className="bg-blue-900 p-6 border-b border-blue-800 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-800 border border-blue-700 rounded-md">
                <Terminal size={24} className="text-blue-100" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Urban Infrastructure Comparison
                </h1>
                <p className="text-blue-200 text-sm mt-1">
                  Comparative Analysis System
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-blue-300 hover:text-white p-2 border border-blue-700 hover:bg-blue-800 transition-colors rounded-md"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 mb-6 rounded-md">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Analysis Configuration
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  City A
                </label>
                <input
                  type="text"
                  placeholder="e.g., San Francisco, CA"
                  value={city1Name}
                  onChange={(e) => setCity1Name(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  City B
                </label>
                <input
                  type="text"
                  placeholder="e.g., New York, NY"
                  value={city2Name}
                  onChange={(e) => setCity2Name(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Radius: {(radius / 1000).toFixed(1)} km
                </label>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 dark:bg-blue-800 appearance-none cursor-pointer rounded-sm"
                />
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Area: {calculateCircleArea(radius).toFixed(1)} km²
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Run Analysis
                </label>
                <button
                  onClick={handleCompare}
                  disabled={loading || !city1Name.trim() || !city2Name.trim()}
                  className="w-full h-[52px] bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-800 rounded-md"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </div>
                  ) : (
                    'ANALYZE'
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Select Amenity Types ({selectedAmenities.length} selected)
              </label>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {AMENITY_OPTIONS.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-2 border text-xs font-medium transition-colors rounded-md ${
                      selectedAmenities.includes(amenity)
                        ? 'border-blue-600 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {amenity.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-6 rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-800/50 border border-red-200 dark:border-red-700 rounded-md">
                  <X size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-red-900 dark:text-red-200">Error</p>
                  <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {comparisonData && (
          <div className="p-6 space-y-8">
            
            {/* Summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-md">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                Analysis Summary: {comparisonData.amenities.join(', ')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">Study Area</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{comparisonData.comparison.area} km²</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">Total Features</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{comparisonData.metadata.dataPoints.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">Density Difference</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{Math.abs(comparisonData.comparison.densityDifference)}%</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">Analysis Date</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-400">{comparisonData.metadata.analysisDate}</div>
                </div>
              </div>
            </div>

            {/* KEY INSIGHTS - Updated colors */}
              <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    🔍 Key Insights
                  </h2>
                  <div className="text-right">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-bold">Similarity Score</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {similarityScore.toFixed(0)}%
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">
                      {similarityScore > 70 ? "Very Similar" : similarityScore > 40 ? "Moderately Different" : "Very Different"}
                    </div>
                  </div>
                </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.importance === 'high'
                        ? 'bg-white dark:bg-blue-900 border-orange-500'
                        : 'bg-white dark:bg-blue-900 border-blue-400'
                    } shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{insight.icon}</div>
                      <p
                        className="text-sm text-gray-800 dark:text-gray-200"
                        dangerouslySetInnerHTML={{ __html: insight.text }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Comparison Bar */}
              <div className="mt-6 p-4 bg-white dark:bg-blue-900 rounded-lg">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Overall Urban Character Comparison
                </h3>
                <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 flex items-center justify-end pr-3"
                    style={{ width: `${(comparisonData.city1.total / (comparisonData.city1.total + comparisonData.city2.total)) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {comparisonData.city1.name.split(',')[0]}
                    </span>
                  </div>
                  <div
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-indigo-500 to-indigo-600 transition-all duration-1000 flex items-center justify-start pl-3"
                    style={{ width: `${(comparisonData.city2.total / (comparisonData.city1.total + comparisonData.city2.total)) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {comparisonData.city2.name.split(',')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{comparisonData.city1.total} amenities</span>
                  <span>{comparisonData.city2.total} amenities</span>
                </div>
              </div>
            </div>

            {/* Maps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CityMapCard data={comparisonData.city1} label="City A" radius={radius} />
              <CityMapCard data={comparisonData.city2} label="City B" radius={radius} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Density Chart */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Density Distribution (features/km²)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { 
                      city: comparisonData.city1.name.split(',')[0], 
                      density: parseFloat(comparisonData.city1.density.toFixed(2)),
                      total: comparisonData.city1.total
                    },
                    { 
                      city: comparisonData.city2.name.split(',')[0], 
                      density: parseFloat(comparisonData.city2.density.toFixed(2)),
                      total: comparisonData.city2.total
                    }
                  ]}>
                    <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px'
                      }}
                      formatter={(value, name, props) => [
                        `${value} features/km² (${props.payload.total} total)`,
                        'Density'
                      ]}
                    />
                    <Bar dataKey="density" radius={[4, 4, 0, 0]}>
                      <Cell fill="#1e3a8a" />
                      <Cell fill="#3b82f6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Spatial Pattern */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Spatial Distribution Pattern
                </h3>
                <SpatialPatternDisplay city1={comparisonData.city1} city2={comparisonData.city2} />
              </div>
            </div>

            {/* Statistical Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-md">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                Statistical Comparison
              </h3>
              <StatisticalTable city1={comparisonData.city1} city2={comparisonData.city2} />
            </div>

            {/* Export */}
            <div className="bg-blue-900 border border-blue-800 p-6 rounded-md">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-blue-800 pb-2">
                Export Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ExportButton
                  onClick={() => downloadComparisonCSV(
                    comparisonData,
                    `analysis_${comparisonData.city1.name.split(',')[0]}_vs_${comparisonData.city2.name.split(',')[0]}.csv`
                  )}
                  title="Summary CSV"
                  description="Key metrics and comparisons"
                />
                <ExportButton
                  onClick={() => downloadDetailedComparisonCSV(
                    comparisonData,
                    radius,
                    `detailed_${comparisonData.city1.name.split(',')[0]}_vs_${comparisonData.city2.name.split(',')[0]}.csv`
                  )}
                  title="Detailed CSV"
                  description="Complete analysis data"
                />
                <ExportButton
                  onClick={() => downloadComparisonJSON(
                    comparisonData,
                    `data_${comparisonData.city1.name.split(',')[0]}_vs_${comparisonData.city2.name.split(',')[0]}.json`
                  )}
                  title="Raw JSON"
                  description="Machine-readable format"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components OUTSIDE the main component
const CityMapCard = ({ data, label, radius }) => {
  const pattern = interpretSpatialPattern(data.spatialPattern);
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-bold uppercase">{label}</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{data.name.split(',')[0]}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {data.coordinates[0].toFixed(4)}, {data.coordinates[1].toFixed(4)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">{data.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">features</div>
        </div>
      </div>
      
      <div className="mb-4 h-64 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden relative">
        <SimpleMap 
          center={data.coordinates} 
          data={data.data} 
          radius={radius}
          cityName={data.name.split(',')[0]}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600 dark:text-gray-400 font-bold">Density</div>
          <div className="font-mono text-blue-900 dark:text-blue-400 font-bold">{data.density.toFixed(2)} pts/km²</div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400 font-bold">Diversity</div>
          <div className="font-mono text-blue-900 dark:text-blue-400 font-bold">{data.diversityIndex.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400 font-bold">Pattern</div>
          <div className="text-gray-900 dark:text-white font-bold">{pattern.pattern}</div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400 font-bold">NNI</div>
          <div className="font-mono text-blue-900 dark:text-blue-400 font-bold">{data.spatialPattern.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
};

const SimpleMap = ({ center, data, radius, cityName }) => {
  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: '#1e3a8a',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5',
        }}
      />
      
      <Marker position={center}>
        <Popup>
          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>{cityName} Center</div>
            <div style={{ color: '#666' }}>
              {center[0].toFixed(4)}, {center[1].toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>
      
      {data && data.slice(0, 50).map((item, index) => {
        const lat = item.lat || item.center?.lat;
        const lon = item.lon || item.center?.lon;
        
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
        
        return (
          <Marker
            key={`${item.id || index}`}
            position={[parseFloat(lat), parseFloat(lon)]}
          >
            <Popup>
              <div style={{ fontSize: '12px' }}>
                <div style={{ fontWeight: 'bold' }}>
                  {item.tags?.name || 'Unnamed'}
                </div>
                <div style={{ color: '#666' }}>
                  {item.tags?.amenity || 'Unknown type'}
                </div>
                {item.tags?.cuisine && (
                  <div style={{ color: '#999' }}>
                    Cuisine: {item.tags.cuisine}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

const SpatialPatternDisplay = ({ city1, city2 }) => {
  const pattern1 = interpretSpatialPattern(city1.spatialPattern);
  const pattern2 = interpretSpatialPattern(city2.spatialPattern);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          <strong>Nearest Neighbor Index (NNI):</strong> Measures spatial clustering
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          &lt;0.8 = Clustered • ~1.0 = Random • &gt;1.2 = Dispersed
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-blue-200 dark:border-blue-700 p-4 rounded-md">
          <div className="font-bold text-gray-900 dark:text-white mb-2">{city1.name.split(',')[0]}</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pattern:</span>
              <span className="font-mono text-blue-900 dark:text-blue-400 font-bold">{pattern1.pattern}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">NNI:</span>
              <span className="font-mono text-gray-900 dark:text-white font-bold">{city1.spatialPattern.toFixed(4)}</span>
            </div>
          </div>
        </div>
        <div className="border border-blue-200 dark:border-blue-700 p-4 rounded-md">
          <div className="font-bold text-gray-900 dark:text-white mb-2">{city2.name.split(',')[0]}</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pattern:</span>
              <span className="font-mono text-blue-900 dark:text-blue-400 font-bold">{pattern2.pattern}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">NNI:</span>
              <span className="font-mono text-gray-900 dark:text-white font-bold">{city2.spatialPattern.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatisticalTable = ({ city1, city2 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 dark:border-gray-700">
        <thead>
          <tr className="bg-blue-900 text-white border-b border-blue-800">
            <th className="p-3 text-left text-sm font-bold">Metric</th>
            <th className="p-3 text-center text-sm font-bold">{city1.name.split(',')[0]}</th>
            <th className="p-3 text-center text-sm font-bold">{city2.name.split(',')[0]}</th>
            <th className="p-3 text-center text-sm font-bold">Difference</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Total Features</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city1.total}</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city2.total}</td>
            <td className="p-3 text-center text-sm font-mono font-bold text-gray-900 dark:text-white">{city1.total - city2.total}</td>
          </tr>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Density (pts/km²)</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city1.density.toFixed(2)}</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city2.density.toFixed(2)}</td>
            <td className="p-3 text-center text-sm font-mono font-bold text-gray-900 dark:text-white">{(city1.density - city2.density).toFixed(2)}</td>
          </tr>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Shannon Diversity</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city1.diversityIndex.toFixed(3)}</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city2.diversityIndex.toFixed(3)}</td>
            <td className="p-3 text-center text-sm font-mono font-bold text-gray-900 dark:text-white">{(city1.diversityIndex - city2.diversityIndex).toFixed(3)}</td>
          </tr>
          <tr>
            <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Spatial Pattern (NNI)</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city1.spatialPattern.toFixed(4)}</td>
            <td className="p-3 text-center text-sm font-mono text-blue-900 dark:text-blue-400 font-bold">{city2.spatialPattern.toFixed(4)}</td>
            <td className="p-3 text-center text-sm font-mono font-bold text-gray-900 dark:text-white">{(city1.spatialPattern - city2.spatialPattern).toFixed(4)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const ExportButton = ({ onClick, title, description }) => (
  <button
    onClick={onClick}
    className="p-4 bg-blue-800 border border-blue-700 hover:bg-blue-700 transition-colors text-white rounded-md"
  >
    <div className="flex items-center gap-3 mb-2">
      <Download size={16} />
      <span className="font-bold">{title}</span>
    </div>
    <div className="text-sm text-blue-200">
      {description}
    </div>
  </button>
);

export default ComparisonModal;