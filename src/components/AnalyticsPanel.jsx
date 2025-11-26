import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ArrowLeft } from 'lucide-react';

// 恢复彩色方案，让饼图更容易区分
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const AnalyticsPanel = ({ data, amenityLabel, onCategoryClick, activeFilter, onClearFilter }) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, topNames: [], breakdown: [] };
    
    const total = data.length;
    const nameCounts = {};
    const typeCounts = {};
    
    data.forEach(item => {
      const name = item.tags.name || "Unknown";
      nameCounts[name] = (nameCounts[name] || 0) + 1;
      
      let subType = "General";
      if (item.tags.cuisine) subType = item.tags.cuisine.split(';')[0];
      else if (item.tags.religion) subType = item.tags.religion;
      else if (item.tags['school:type']) subType = item.tags['school:type'];
      
      subType = subType.charAt(0).toUpperCase() + subType.slice(1);
      typeCounts[subType] = (typeCounts[subType] || 0) + 1;
    });
    
    const topNames = Object.entries(nameCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.substring(0, 15), count }));
    
    const breakdown = Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    
    return { total, topNames, breakdown };
  }, [data]);

  if (stats.total === 0) return (
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
              {activeFilter} ({stats.total})
            </h2>
          </div>
        ) : (
          <h2 className="text-xl font-bold mb-6 text-blue-900 dark:text-blue-100">
            Analytics
          </h2>
        )}

        {/* Total Count Card */}
        <div className="bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 p-4 mb-6 text-center rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-300 uppercase font-bold">Total Found</p>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-200">{stats.total}</p>
        </div>

        {/* Category Breakdown Pie Chart - 保持彩色！ */}
        {!activeFilter && stats.breakdown.length > 0 && (
          <div className="mb-6 h-64 relative">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2">
              Category Breakdown 
              <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-2">
                (Click to Filter)
              </span>
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.breakdown}
                  cx="50%" 
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => onCategoryClick(data.name)} 
                  className="cursor-pointer outline-none"
                >
                  // ... (continuing AnalyticsPanel.jsx)

                  {/* 使用彩色方案，保持饼图容易区分 */}
                  {stats.breakdown.map((entry, index) => (
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
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Locations Bar Chart - 使用蓝色主题 */}
        <div className="mt-12 h-64">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-4">Top Locations</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topNames} layout="vertical" margin={{ left: 0 }}>
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
                {stats.topNames.map((entry, index) => (
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

export default AnalyticsPanel;
