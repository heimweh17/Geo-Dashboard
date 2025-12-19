import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Filter,
  MapPin,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  Code2,
} from 'lucide-react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Rectangle,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

/** ---------- Helpers ---------- */

const PIE_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#60a5fa', // blue-400
];

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const colorScale = (value, max) => {
  if (!max) return 'rgba(99,102,241,0.12)'; // indigo-ish
  const t = Math.max(0, Math.min(1, value / max));
  const alpha = 0.10 + 0.45 * t;
  return `rgba(59,130,246,${alpha})`; // blue-ish
};

const hashString = (s) => {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const colorForCategory = (category) => {
  if (!category) return '#3b82f6'; // default blue
  const idx = hashString(String(category)) % PIE_COLORS.length;
  return PIE_COLORS[idx];
};

const svgToDataUrl = (svg) => {
  const b64 = typeof window !== 'undefined' && window.btoa ? window.btoa(svg) : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
};

const createOsmMarkerIcon = ({ color = '#3b82f6', centroid = false }) => {
  // Create a true Leaflet image icon using an SVG data URL (OSM-style pin).
  // Positioning relies ONLY on iconAnchor; no CSS transforms inside the SVG or on the element.
  const fill = centroid ? '#10b981' : color;
  const svg = `
<svg width="26" height="41" viewBox="0 0 26 41" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>
  <ellipse cx="13" cy="39" rx="7.5" ry="2.3" fill="rgba(0,0,0,0.25)"/>
  <path filter="url(#ds)"
    d="M13 0C6.7 0 1.7 5 1.7 11.2c0 8.3 11.3 28.8 11.3 28.8s11.3-20.5 11.3-28.8C24.3 5 19.3 0 13 0z"
    fill="${fill}" stroke="white" stroke-width="2" />
  <circle cx="13" cy="11.5" r="4.2" fill="white" />
</svg>`;
  return L.icon({
    iconUrl: svgToDataUrl(svg),
    iconSize: [26, 41],
    iconAnchor: [13, 41],
    popupAnchor: [0, -36],
  });
};
  

const FitToBBox = ({ bbox }) => {
  const map = useMap();
  useEffect(() => {
    if (!bbox) return;
    const { min_lat, max_lat, min_lon, max_lon } = bbox;
    const bounds = [
      [safeNum(min_lat), safeNum(min_lon)],
      [safeNum(max_lat), safeNum(max_lon)],
    ];
    try {
      map.fitBounds(bounds, { padding: [30, 30] });
    } catch {}
  }, [bbox, map]);
  return null;
};

const FitToData = ({ bbox, points, watchKey }) => {
  const map = useMap();
  useEffect(() => {
    if (bbox) {
      const { min_lat, max_lat, min_lon, max_lon } = bbox || {};
      const vals = [min_lat, max_lat, min_lon, max_lon].map((v) => Number(v));
      if (vals.every((v) => Number.isFinite(v))) {
        try {
          map.fitBounds(
            [
              [vals[0], vals[2]],
              [vals[1], vals[3]],
            ],
            { padding: [30, 30] }
          );
          return;
        } catch {}
      }
    }
    if (Array.isArray(points) && points.length > 0) {
      const latlngs = points
        .map((p) => [Number(p.lat), Number(p.lon)])
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));
      if (latlngs.length > 0) {
        try {
          map.fitBounds(latlngs, { padding: [30, 30] });
        } catch {}
      }
    }
  }, [bbox, points, map, watchKey]);
  return null;
};

const FlyTo = ({ target, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    try {
      map.flyTo(target, zoom, { duration: 0.8 });
    } catch {}
  }, [target, zoom, map]);
  return null;
};

/** ---------- Main ---------- */

const AnalysisResultsModal = ({ isOpen, onClose, analysisResult, points, params }) => {
  const [tab, setTab] = useState('overview'); // overview | charts | raw
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showGrid, setShowGrid] = useState(false); // OFF by default
  const [showPins, setShowPins] = useState(true);
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [activePointIndex, setActivePointIndex] = useState(null);

  // Normalize analysisResult parts
  const summary = analysisResult?.summary || {};
  const clustering = analysisResult?.clustering || {};
  const grid = analysisResult?.grid_density || {};
  const bbox = summary?.bbox;

  // categories from analysisResult (preferred)
  const categories = useMemo(() => {
    const cc = summary?.category_counts || {};
    return Object.entries(cc)
      .map(([k, v]) => ({ key: String(k), count: safeNum(v, 0) }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [summary]);

  const pieData = useMemo(() => {
    return categories.map((c) => ({ name: c.key, value: c.count }));
  }, [categories]);

  const clusterData = useMemo(() => {
    const arr = Array.isArray(clustering?.clusters) ? clustering.clusters : [];
    return arr
      .map((c) => ({
        name: `#${c.cluster_id}`,
        size: safeNum(c.size, 0),
        cluster_id: c.cluster_id,
        lat: safeNum(c?.centroid?.lat, 0),
        lon: safeNum(c?.centroid?.lon, 0),
      }))
      .sort((a, b) => b.size - a.size);
  }, [clustering]);

  const activeClusterTarget = useMemo(() => {
    if (activeClusterId == null) return null;
    const c = clusterData.find((x) => x.cluster_id === activeClusterId);
    if (!c) return null;
    return [c.lat, c.lon];
  }, [activeClusterId, clusterData]);

  const filteredPoints = useMemo(() => {
    if (!Array.isArray(points)) return [];
    if (!selectedCategory) return points;
    return points.filter((p) => String(p.category || '') === String(selectedCategory));
  }, [points, selectedCategory]);

  const maxGridCount = useMemo(() => {
    if (!Array.isArray(grid?.cells)) return 0;
    return grid.cells.reduce((m, c) => Math.max(m, safeNum(c.count, 0)), 0);
  }, [grid]);

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const meanCenterText = useMemo(() => {
    const mc = summary?.mean_center;
    if (!mc) return '-';
    const lat = safeNum(mc.lat, null);
    const lon = safeNum(mc.lon, null);
    if (lat == null || lon == null) return '-';
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }, [summary]);

  const totalPoints = safeNum(summary?.total_points, Array.isArray(points) ? points.length : 0);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-800 shadow-2xl w-full max-w-6xl relative rounded-xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950 dark:to-blue-950">
          <div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">Dataset Analysis</div>
            <div className="text-xs text-blue-700 dark:text-blue-300 opacity-80">
              {params?.category_field ? `Category field: ${params.category_field}` : ' '}
              {params?.dbscan_eps_km != null ? ` • DBSCAN eps: ${params.dbscan_eps_km} km` : ''}
              {params?.grid_cell_size != null ? ` • Grid: ${params.grid_cell_size}` : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-700 hover:bg-purple-800 text-white text-sm"
            >
              <Download size={16} />
              JSON
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-[80vh]">
          {/* Map */}
          <div className="relative h-[42vh] lg:h-full">
            {/* tiny map overlay controls */}
            <div className="absolute z-[500] top-3 left-3 flex gap-2">
              <button
                onClick={() => setShowPins((v) => !v)}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm border shadow-sm',
                  showPins
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white/90 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700',
                ].join(' ')}
              >
                <MapPin size={16} />
                {showPins ? 'Pins: ON' : 'Pins: OFF'}
              </button>
              <button
                onClick={() => setShowGrid((v) => !v)}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm border shadow-sm',
                  showGrid
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white/90 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700',
                ].join(' ')}
              >
                <Layers size={16} />
                {showGrid ? 'Grid: ON' : 'Grid: OFF'}
              </button>

              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-3 py-2 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <MapContainer
              style={{ height: '100%', width: '100%' }}
              center={[safeNum(summary?.mean_center?.lat, 0), safeNum(summary?.mean_center?.lon, 0)]}
              zoom={3}
              preferCanvas
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {bbox && <FitToBBox bbox={bbox} />}
              {!bbox && (
                <FitToData bbox={null} points={filteredPoints.length > 0 ? filteredPoints : points} watchKey={selectedCategory} />
              )}
              {activeClusterTarget && <FlyTo target={activeClusterTarget} zoom={15} />}

              {/* Grid overlay (OFF by default) */}
              {showGrid &&
                Array.isArray(grid?.cells) &&
                grid.cells.map((cell, idx) => {
                  const minLat = safeNum(cell.min_lat, NaN);
                  const minLon = safeNum(cell.min_lon, NaN);
                  const maxLat = safeNum(cell.max_lat, NaN);
                  const maxLon = safeNum(cell.max_lon, NaN);
                  if ([minLat, minLon, maxLat, maxLon].some(Number.isNaN)) return null;
                  const fillColor = colorScale(safeNum(cell.count, 0), maxGridCount);
                  return (
                    <Rectangle
                      key={`cell-${idx}`}
                      bounds={[
                        [minLat, minLon],
                        [maxLat, maxLon],
                      ]}
                      pathOptions={{ color: 'transparent', fillColor, fillOpacity: 1 }}
                    />
                  );
                })}

              {/* Pins (Leaflet Markers with custom divIcon) */}
              {showPins &&
                Array.isArray(points) &&
                points.map((p, idx) => {
                  const lat = safeNum(p.lat, NaN);
                  const lon = safeNum(p.lon, NaN);
                  if ([lat, lon].some(Number.isNaN)) return null;

                  const isMatch =
                    !selectedCategory || String(p.category || '') === String(selectedCategory);
                  const isActive = activePointIndex === idx;
                  const color = colorForCategory(p.category);
                  const icon = createOsmMarkerIcon({ color, centroid: false });


                  return (
                    <Marker
                      key={`pt-${idx}`}
                      position={[lat, lon]}
                      icon={icon}
                      opacity={isMatch ? 1 : 0.35}
                      eventHandlers={{
                        click: () => setActivePointIndex(idx),
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-bold flex items-center gap-2">
                            <MapPin size={14} />
                            Point
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            {lat.toFixed(6)}, {lon.toFixed(6)}
                          </div>
                          <div className="text-xs mt-2">
                            <span className="font-semibold">Category:</span>{' '}
                            {String(p.category || 'uncategorized')}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Cluster centroids as distinct pins */}
              {Array.isArray(clustering?.clusters) &&
                clustering.clusters.map((c) => {
                  const lat = safeNum(c?.centroid?.lat, NaN);
                  const lon = safeNum(c?.centroid?.lon, NaN);
                  if ([lat, lon].some(Number.isNaN)) return null;

                  const isActive = activeClusterId === c.cluster_id;

                  const centroidIcon = createOsmMarkerIcon({ color: '#10b981', centroid: true });

                  return (
                    <Marker
                      key={`centroid-${c.cluster_id}`}
                      position={[lat, lon]}
                      icon={centroidIcon}
                      eventHandlers={{
                        click: () => setActiveClusterId(c.cluster_id),
                      }}
                    >
                      <Popup>
                        <div>
                          <div className="font-bold text-sm">Cluster #{c.cluster_id}</div>
                          <div className="text-xs opacity-80">size: {c.size}</div>
                          <div className="text-xs opacity-80 mt-1">
                            {lat.toFixed(6)}, {lon.toFixed(6)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>

            {/* Grid legend */}
            {showGrid && Number.isFinite(maxGridCount) && maxGridCount > 0 && (
              <div className="absolute z-[500] bottom-3 right-3 p-3 rounded-md bg-white/90 dark:bg-blue-950/85 border border-blue-200 dark:border-blue-700 shadow">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Density (count)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-900 dark:text-blue-200">0</span>
                  <div
                    className="h-2 w-28 rounded-sm"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(59,130,246,0.12), rgba(59,130,246,0.55))',
                    }}
                  />
                  <span className="text-[10px] text-blue-900 dark:text-blue-200">{maxGridCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="h-full overflow-y-auto bg-blue-50 dark:bg-blue-900/30 border-l border-blue-200 dark:border-blue-800">
            {/* Tabs */}
            <div className="sticky top-0 z-10 bg-blue-50/95 dark:bg-blue-950/70 backdrop-blur border-b border-blue-200 dark:border-blue-800 px-5 py-3">
              <div className="flex items-center gap-2">
                <TabBtn
                  active={tab === 'overview'}
                  onClick={() => setTab('overview')}
                  icon={<BarChart3 size={16} />}
                  label="Overview"
                />
                <TabBtn
                  active={tab === 'charts'}
                  onClick={() => setTab('charts')}
                  icon={<PieIcon size={16} />}
                  label="Charts"
                />
                <TabBtn
                  active={tab === 'raw'}
                  onClick={() => setTab('raw')}
                  icon={<Code2 size={16} />}
                  label="Raw"
                />
              </div>

              {selectedCategory && (
                <div className="mt-3 text-xs text-blue-900 dark:text-blue-100">
                  Filtering: <span className="font-bold">{selectedCategory}</span>{' '}
                  <span className="opacity-70">({filteredPoints.length} points)</span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3">
                <KPI title="Total Points" value={totalPoints} />
                <KPI title="Mean Center" value={meanCenterText} small />
                <KPI title="Clusters" value={clustering?.num_clusters ?? '-'} />
                <KPI title="Noise" value={clustering?.num_noise ?? '-'} />
              </div>

              {/* BBox */}
              <div className="p-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-blue-600 dark:text-blue-300 font-semibold mb-2">
                  Bounding Box (BBox)
                </div>
                <div className="text-xs text-blue-900 dark:text-blue-100 break-words">
                  {bbox ? JSON.stringify(bbox) : 'No bbox returned'}
                </div>
              </div>

              {/* Overview tab */}
              {tab === 'overview' && (
                <>
                  {/* Categories quick list */}
                  <div className="p-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        Category Counts
                        <span className="text-xs font-normal opacity-70 ml-2">(click to filter)</span>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                      >
                        Clear
                      </button>
                    </div>

                    {categories.length === 0 ? (
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        No category_counts found in analysis result. (Still showing clusters + raw JSON)
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {categories.slice(0, 12).map((c) => {
                          const pct = totalPoints > 0 ? ((c.count / totalPoints) * 100).toFixed(1) : '0.0';
                          const swatch = colorForCategory(c.key);
                          return (
                            <button
                              key={c.key}
                              onClick={() => setSelectedCategory(c.key)}
                              className={[
                                'w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition',
                                selectedCategory === c.key
                                  ? 'bg-emerald-100 dark:bg-emerald-900/25 border-emerald-400 dark:border-emerald-700'
                                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900',
                              ].join(' ')}
                            >
                              <span className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100">
                                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: swatch }} />
                                {c.key}
                              </span>
                              <span className="font-mono text-blue-900 dark:text-blue-100">
                                {c.count} • {pct}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Cluster list */}
                  <div className="p-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        Clusters
                        <span className="text-xs font-normal opacity-70 ml-2">(click to focus map)</span>
                      </div>
                      <button
                        onClick={() => setActiveClusterId(null)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                      >
                        Clear
                      </button>
                    </div>

                    {clusterData.length === 0 ? (
                      <div className="text-xs text-blue-700 dark:text-blue-300">No clusters</div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {clusterData.slice(0, 20).map((c) => (
                          <button
                            key={c.cluster_id}
                            onClick={() => setActiveClusterId(c.cluster_id)}
                            className={[
                              'w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition',
                              activeClusterId === c.cluster_id
                                ? 'bg-emerald-100 dark:bg-emerald-900/25 border-emerald-400 dark:border-emerald-700'
                                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900',
                            ].join(' ')}
                          >
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              Cluster {c.name}
                            </span>
                            <span className="font-mono text-blue-900 dark:text-blue-100">
                              size {c.size}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Charts tab */}
              {tab === 'charts' && (
                <>
                  {/* Category Pie */}
                  <div className="p-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        Category Pie
                      </div>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                      >
                        Clear Filter
                      </button>
                    </div>

                    {pieData.length === 0 ? (
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        No category_counts → cannot build pie chart.
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={2}
                              onClick={(d) => setSelectedCategory(d?.name || null)}
                              className="cursor-pointer outline-none"
                            >
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Cluster Bar */}
                  <div className="p-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        Cluster Sizes
                      </div>
                      <button
                        onClick={() => setActiveClusterId(null)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                      >
                        Clear
                      </button>
                    </div>

                    {clusterData.length === 0 ? (
                      <div className="text-xs text-blue-700 dark:text-blue-300">No clusters</div>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={clusterData.slice(0, 12)} layout="vertical">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={45} />
                            <RTooltip />
                            <Bar
                              dataKey="size"
                              radius={[0, 6, 6, 0]}
                              onClick={(d) => setActiveClusterId(d?.cluster_id ?? null)}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 opacity-80 flex items-center gap-2">
                      <Filter size={14} />
                      Click a bar to fly-to that cluster on the map.
                    </div>
                  </div>
                </>
              )}

              {/* Raw tab */}
              {tab === 'raw' && (
                <div className="p-4 rounded-lg bg-blue-950 text-blue-100 border border-blue-800">
                  <pre className="text-xs overflow-x-auto max-h-[52vh]">
{JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/** ---------- Small UI components ---------- */

const TabBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={[
      'flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition',
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900',
    ].join(' ')}
  >
    {icon}
    {label}
  </button>
);

const KPI = ({ title, value, small = false }) => (
  <div className="p-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
    <div className="text-xs text-blue-600 dark:text-blue-300 font-semibold">{title}</div>
    <div
      className={[
        'mt-1 text-blue-900 dark:text-blue-100 font-bold',
        small ? 'text-sm' : 'text-2xl',
        'break-words',
      ].join(' ')}
    >
      {value}
    </div>
  </div>
);

export default AnalysisResultsModal;
