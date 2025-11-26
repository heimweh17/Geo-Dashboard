import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ArrowLeft, TrendingUp, Layers, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  calculateCircleArea, 
  calculateDensity, 
  calculateDiversityIndex, 
  calculateNearestNeighborIndex,
  analyzeAmenityBreakdown,
  interpretSpatialPattern
} from '../utlis/gisAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const AnalyticsPanel = ({ 
  data, 
  amenityLabel, 
  onCategoryClick, 
  activeFilter, 
  onClearFilter,
  searchRadius,
  customPolygon 
}) => {
  
  const [showSubcategories, setShowSubcategories] = useState(true);
  
  // Calculate advanced metrics
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    // Calculate area
    const area = customPolygon 
      ? calculatePolygonArea(customPolygon) 
      : calculateCircleArea(searchRadius);
    
    // Basic stats
    const total = data.length;
    const breakdown = analyzeAmenityBreakdown(data);
    
    // Advanced metrics
    const density = calculateDensity(total, area);
    const diversityIndex = calculateDiversityIndex(breakdown.byAmenity);
    const spatialPattern = calculateNearestNeighborIndex(data, area);
    const pattern = interpretSpatialPattern(spatialPattern);
    
    // Walkability score
    const walkabilityScore = Math.min(
      (density / 50) * 50 + (diversityIndex / 2.5) * 50,
      100
    );
    
    // PRIMARY CATEGORIES (Broad amenity types)
    const topAmenities = Object.entries(breakdown.byAmenity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ 
        name: name.replace(/_/g, ' '), 
        value,
        key: name 
      }));
    
    // SUBCATEGORIES (Cuisine, Religion, School Type, etc.)
    const subcategories = [];
    
    // Add cuisines
    Object.entries(breakdown.byCuisine).forEach(([cuisine, count]) => {
      subcategories.push({
        name: cuisine,
        value: count,
        type: 'cuisine',
        icon: '🍽️'
      });
    });
    
    // Add religions
    Object.entries(breakdown.byReligion).forEach(([religion, count]) => {
      subcategories.push({
        name: religion,
        value: count,
        type: 'religion',
        icon: '⛪'
      });
    });
    
    // Add school types
    Object.entries(breakdown.bySchoolType).forEach(([schoolType, count]) => {
      subcategories.push({
        name: schoolType,
        value: count,
        type: 'school',
        icon: '🏫'
      });
    });
    
    // Sort subcategories by count
    subcategories.sort((a, b) => b.value - a.value);
    const topSubcategories = subcategories.slice(0, 8);
    
    // Top locations by name
    const topNames = {};
    data.forEach(item => {
      const name = item.tags?.name || "Unknown";
      topNames[name] = (topNames[name] || 0) + 1;
    });
    
    const topLocations = Object.entries(topNames)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.substring(0, 15), count }));
    
    // Chain vs Independent
    const chainPct = (breakdown.chainsVsIndependent.chains / total) * 100;
    const independentPct = (breakdown.chainsVsIndependent.independent / total) * 100;
    
    // Accessibility
    const accessibilityPct = (breakdown.accessibilityCount / total) * 100;
    
    return {
      total,
      area: area.toFixed(2),
      density: density.toFixed(2),
      diversityIndex: diversityIndex.toFixed(3),
      spatialPattern: spatialPattern.toFixed(3),
      pattern: pattern.pattern,
      patternColor: pattern.color,
      patternIcon: pattern.icon,
      walkabilityScore: walkabilityScore.toFixed(0),
      topAmenities,
      topSubcategories,
      topLocations,
      breakdown,
      chainPct: chainPct.toFixed(1),
      independentPct: independentPct.toFixed(1),
      accessibilityPct: accessibilityPct.toFixed(1),
      cuisineCount: Object.keys(breakdown.byCuisine).length
    };
  }, [data, searchRadius, customPolygon]);

  if (!metrics) {
    return (
      <div className="w-full md:w-80 p-6 bg-white dark:bg-blue-950 border-l border-blue-200 dark:border-blue-800 shadow-xl flex flex-col items-center justify-center text-center h-full">
        {activeFilter ? (
          <>
            <p className="text-blue-600 dark:text-blue-400 mb-4">No results for "{activeFilter}"</p>
            <button 
              onClick={onClearFilter} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-400 dark:border-blue-600 hover:bg-blue-300 dark:hover:bg-blue-700 transition rounded-md"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
              No {amenityLabel} found
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              Try a larger radius or a different area.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-white dark:bg-blue-950 border-l border-blue-200 dark:border-blue-800 shadow-xl overflow-y-auto">
      <div className="p-6 pb-12">
        
        {activeFilter ? (
          <div className="mb-6">
            <button 
              onClick={onClearFilter} 
              className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 mb-2 transition"
            >
              <ArrowLeft size={16} /> Back to all
            </button>
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {activeFilter} ({metrics.total})
            </h2>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Activity size={24} />
              Area Analytics
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {customPolygon ? 'Custom area selected' : `${(searchRadius/1000).toFixed(1)} km radius`}
            </p>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard 
            label="Total Found" 
            value={metrics.total} 
            icon="📍"
            color="blue"
          />
          <MetricCard 
            label="Study Area" 
            value={`${metrics.area} km²`}
            icon="🗺️"
            color="blue"
          />
          <MetricCard 
            label="Density" 
            value={`${metrics.density} /km²`}
            icon="🏙️"
            color="green"
            tooltip="Amenities per square kilometer"
          />
          <MetricCard 
            label="Diversity" 
            value={metrics.diversityIndex}
            icon="🌈"
            color="purple"
            tooltip="Shannon diversity index"
          />
        </div>

        {/* Spatial Pattern */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 p-4 mb-6 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
              Spatial Pattern
            </h3>
            <span className="text-2xl">{metrics.patternIcon}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className={`text-lg font-bold ${metrics.patternColor}`}>
              {metrics.pattern}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
              NNI: {metrics.spatialPattern}
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            {metrics.pattern === 'Clustered' && '📍 Amenities form concentrated hubs'}
            {metrics.pattern === 'Dispersed' && '🌐 Amenities are evenly spread out'}
            {metrics.pattern === 'Random' && '🎲 No clear spatial organization'}
          </div>
        </div>

        {/* Walkability Score */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-300 dark:border-green-700 p-4 mb-6 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              🚶 Walkability Score
            </h3>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.walkabilityScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.walkabilityScore}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {metrics.walkabilityScore > 75 && '⭐ Excellent pedestrian infrastructure'}
            {metrics.walkabilityScore > 50 && metrics.walkabilityScore <= 75 && '👍 Good walkability'}
            {metrics.walkabilityScore > 25 && metrics.walkabilityScore <= 50 && '🚗 Car-dependent area'}
            {metrics.walkabilityScore <= 25 && '🚙 Low pedestrian accessibility'}
          </div>
        </div>

        {/* PRIMARY CATEGORIES - PIE CHART 1 */}
        {!activeFilter && metrics.topAmenities.length > 0 && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border-2 border-blue-400 dark:border-blue-600 p-4 rounded-lg">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Layers size={16} />
                Primary Categories
                <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-auto">
                  (Click to Filter)
                </span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.topAmenities}
                      cx="50%" 
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      onClick={(data) => onCategoryClick(data.key)} 
                      className="cursor-pointer outline-none"
                    >
                      {metrics.topAmenities.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="hover:opacity-80 transition-opacity" 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#1e293b'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={10}
                      wrapperStyle={{
                        color: '#1e40af',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SUBCATEGORIES - COLLAPSIBLE SECTION */}
        {!activeFilter && metrics.topSubcategories.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowSubcategories(!showSubcategories)}
              className="w-full bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 border-2 border-orange-400 dark:border-orange-600 p-4 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Subcategories ({metrics.topSubcategories.length})
                </h3>
                {showSubcategories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 text-left mt-1">
                Cuisine types, religions, school types
              </p>
            </button>

            {showSubcategories && (
              <div className="mt-3 bg-white dark:bg-blue-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {metrics.topSubcategories.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Filter by this subcategory
                        if (sub.type === 'cuisine') {
                          onCategoryClick(sub.name);
                        } else {
                          onCategoryClick(sub.name);
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors rounded-md group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.icon}</span>
                        <div className="text-left">
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">
                            {sub.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {sub.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {sub.value}
                        </span>
                        <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-300 group-hover:bg-orange-600"
                            style={{ width: `${(sub.value / metrics.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Mix */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-3">
            Business Mix
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">🏢 Chain Businesses</span>
              <span className="font-bold text-blue-900 dark:text-blue-200">{metrics.chainPct}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics.chainPct}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs mt-3">
              <span className="text-gray-600 dark:text-gray-400">🏪 Independent</span>
              <span className="font-bold text-blue-900 dark:text-blue-200">{metrics.independentPct}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${metrics.independentPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Accessibility */}
        {metrics.accessibilityPct > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 p-4 mb-6 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  ♿ Accessibility
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Wheelchair accessible locations
                </p>
              </div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.accessibilityPct}%
              </span>
            </div>
          </div>
        )}

        {/* Top Locations Bar Chart */}
        <div className="mt-12 h-64">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-4">Top Locations</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.topLocations} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                tick={{ fontSize: 10, fill: '#1e40af' }} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                contentStyle={{ 
                  backgroundColor: '#1e3a8a', 
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  color: '#e0e7ff'
                }} 
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {metrics.topLocations.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#1e3a8a" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

// Helper component for metric cards
const MetricCard = ({ label, value, icon, color = "blue", tooltip }) => (
  <div className={`bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-300 dark:border-${color}-700 p-3 rounded-md`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">{label}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <div className={`text-xl font-bold text-${color}-900 dark:text-${color}-200`}>
      {value}
    </div>
    {tooltip && (
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {tooltip}
      </div>
    )}
  </div>
);

// Calculate polygon area (Shoelace formula)
const calculatePolygonArea = (coords) => {
  if (!coords || coords.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].lat * coords[j].lng;
    area -= coords[j].lat * coords[i].lng;
  }
  area = Math.abs(area / 2);
  
  const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(avgLat * Math.PI / 180);
  
  return area * kmPerDegreeLat * kmPerDegreeLng;
};

export default AnalyticsPanel;