import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ArrowLeft, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  calculateCircleArea, 
  calculateDensity, 
  calculateDiversityIndex, 
  calculateNearestNeighborIndex,
  analyzeAmenityBreakdown,
  interpretSpatialPattern
} from '../utlis/gisAnalytics';

// COLORFUL palette for Primary Categories (easy to distinguish)
const PRIMARY_COLORS = [
  '#0088FE', // bright blue
  '#00C49F', // teal
  '#FFBB28', // yellow
  '#FF8042', // orange
  '#8884d8', // purple
  '#82ca9d', // green
  '#ffc658', // gold
  '#ff7c7c', // red
  '#a4de6c', // lime
  '#d084d0', // pink
];

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
    
    const area = customPolygon 
      ? calculatePolygonArea(customPolygon) 
      : calculateCircleArea(searchRadius);
    
    const total = data.length;
    const breakdown = analyzeAmenityBreakdown(data);
    
    const density = calculateDensity(total, area);
    const diversityIndex = calculateDiversityIndex(breakdown.byAmenity);
    const spatialPattern = calculateNearestNeighborIndex(data, area);
    const pattern = interpretSpatialPattern(spatialPattern);
    
    const walkabilityScore = Math.min(
      (density / 50) * 50 + (diversityIndex / 2.5) * 50,
      100
    );
    
    // PRIMARY CATEGORIES
    const topAmenities = Object.entries(breakdown.byAmenity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ 
        name: name.replace(/_/g, ' '), 
        value,
        key: name 
      }));
    
    // SUBCATEGORIES
    const subcategories = [];
    
    Object.entries(breakdown.byCuisine).forEach(([cuisine, count]) => {
      subcategories.push({
        name: cuisine,
        value: count,
        type: 'Cuisine',
        icon: '🍽️'
      });
    });
    
    Object.entries(breakdown.byReligion).forEach(([religion, count]) => {
      subcategories.push({
        name: religion,
        value: count,
        type: 'Religion',
        icon: '⛪'
      });
    });
    
    Object.entries(breakdown.bySchoolType).forEach(([schoolType, count]) => {
      subcategories.push({
        name: schoolType,
        value: count,
        type: 'Education',
        icon: '🎓'
      });
    });
    
    subcategories.sort((a, b) => b.value - a.value);
    const topSubcategories = subcategories.slice(0, 10);
    
    const topNames = {};
    data.forEach(item => {
      const name = item.tags?.name || "Unknown";
      topNames[name] = (topNames[name] || 0) + 1;
    });
    
    const topLocations = Object.entries(topNames)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.substring(0, 15), count }));
    
    const chainPct = (breakdown.chainsVsIndependent.chains / total) * 100;
    const independentPct = (breakdown.chainsVsIndependent.independent / total) * 100;
    const accessibilityPct = (breakdown.accessibilityCount / total) * 100;
    
    return {
      total,
      area: area.toFixed(2),
      density: density.toFixed(2),
      diversityIndex: diversityIndex.toFixed(3),
      spatialPattern: spatialPattern.toFixed(3),
      pattern: pattern.pattern,
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
      <div className="w-full md:w-80 p-6 bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
        {activeFilter ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No results for "{activeFilter}"</p>
            <button 
              onClick={onClearFilter} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition rounded"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4 text-gray-400">📊</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              No data found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Try a larger radius or different area.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 overflow-y-auto">
      <div className="p-6 space-y-6">
        
        {/* Header */}
        {activeFilter ? (
          <div>
            <button 
              onClick={onClearFilter} 
              className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mb-2 transition"
            >
              <ArrowLeft size={16} /> Back to all results
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Filtered: {activeFilter}
            </h2>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Database size={20} className="text-blue-700 dark:text-blue-400" />
              Analysis Results
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {customPolygon ? 'Custom polygon area' : `Radius: ${(searchRadius/1000).toFixed(1)} km`}
            </p>
          </div>
        )}

        {/* TOTAL RESULTS - LARGE AND PROMINENT */}
        <div className="bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-800 dark:to-gray-850 border-2 border-blue-200 dark:border-gray-600 p-6 rounded-lg text-center">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
            Total Results
          </div>
          <div className="text-6xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            {metrics.total}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            amenities found in {metrics.area} km²
          </div>
        </div>

        {/* PRIMARY CATEGORIES - COLORFUL PIE CHART */}
        {!activeFilter && metrics.topAmenities.length > 0 && (
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
              Primary Categories
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                (Click to filter)
              </span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.topAmenities}
                    cx="50%" 
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(data) => onCategoryClick(data.key)} 
                    className="cursor-pointer outline-none"
                  >
                    {metrics.topAmenities.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PRIMARY_COLORS[index % PRIMARY_COLORS.length]} 
                        className="hover:opacity-70 transition-opacity stroke-white dark:stroke-gray-900" 
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: '#1f2937',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    iconSize={10}
                    wrapperStyle={{
                      fontSize: '11px',
                      color: '#4b5563'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SUBCATEGORIES - EXPANDABLE TABLE */}
        {!activeFilter && metrics.topSubcategories.length > 0 && (
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={() => setShowSubcategories(!showSubcategories)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition rounded-t-lg"
            >
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Subcategories ({metrics.topSubcategories.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Detailed breakdown by type
                </p>
              </div>
              {showSubcategories ? 
                <ChevronUp size={18} className="text-gray-600 dark:text-gray-400" /> : 
                <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" />
              }
            </button>

            {showSubcategories && (
              <div className="border-t border-gray-300 dark:border-gray-600">
                {/* Add hint text */}
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-blue-700 dark:text-blue-400 italic">
                    💡 Click any row to filter map results
                  </p>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left p-2 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                        <th className="text-left p-2 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                        <th className="text-right p-2 font-semibold text-gray-700 dark:text-gray-300">Count</th>
                        <th className="text-right p-2 font-semibold text-gray-700 dark:text-gray-300">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topSubcategories.map((sub, idx) => (
                        <tr
                          key={idx}
                          onClick={() => onCategoryClick(sub.name)}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition"
                        >
                          <td className="p-2 text-gray-600 dark:text-gray-400">
                            {sub.type}
                          </td>
                          <td className="p-2 text-gray-900 dark:text-gray-100 font-medium capitalize">
                            {sub.name}
                          </td>
                          <td className="p-2 text-right text-gray-900 dark:text-gray-100 font-mono">
                            {sub.value}
                          </td>
                          <td className="p-2 text-right text-gray-600 dark:text-gray-400 font-mono">
                            {((sub.value / metrics.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAILED METRICS GRID */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
            Statistical Metrics
          </h3>
          <div className="space-y-3">
            
            {/* Density */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600 dark:text-gray-400">Density (points/km²)</span>
              <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{metrics.density}</span>
            </div>
            
            {/* Diversity Index */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600 dark:text-gray-400">Shannon Diversity Index</span>
              <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{metrics.diversityIndex}</span>
            </div>
            
            {/* Spatial Pattern */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-600 dark:text-gray-400">Spatial Pattern (NNI)</span>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metrics.pattern}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-mono">({metrics.spatialPattern})</span>
              </div>
            </div>
            
            {/* Walkability */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Walkability Score</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metrics.walkabilityScore}/100</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.walkabilityScore}%` }}
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* BUSINESS CHARACTERISTICS */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
            Business Characteristics
          </h3>
          <div className="space-y-3">
            
            {/* Chain vs Independent */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Chain Businesses</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{metrics.chainPct}%</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gray-600 dark:bg-gray-500 h-1.5 rounded-full"
                  style={{ width: `${metrics.chainPct}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Independent</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{metrics.independentPct}%</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${metrics.independentPct}%` }}
                />
              </div>
            </div>
            
            {/* Accessibility */}
            {metrics.accessibilityPct > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Wheelchair Accessible</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">{metrics.accessibilityPct}%</span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-gray-700 dark:bg-gray-400 h-1.5 rounded-full"
                    style={{ width: `${metrics.accessibilityPct}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Cuisine Count */}
            {metrics.cuisineCount > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Cuisine Varieties</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metrics.cuisineCount}</span>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* TOP LOCATIONS */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
            Most Frequent Locations
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topLocations} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={85} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }} 
                />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={16}>
                  {metrics.topLocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#1e3a8a" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

// Calculate polygon area
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