/**
 * Export Utilities for GeoAnalytica
 */

export const downloadCSV = (data, filename = "geo-data.csv") => {
  if (!data || data.length === 0) return;
  const headers = ["Name", "Type", "Latitude", "Longitude"];
  const csvContent = [
    headers.join(","),
    ...data.map((item) => {
      const name = item.tags?.name ? `"${item.tags.name}"` : "Unnamed";
      const type = item.tags?.amenity || "Unknown";
      const lat = item.lat || item.center?.lat || "N/A";
      const lon = item.lon || item.center?.lon || "N/A";
      return `${name},${type},${lat},${lon}`;
    }),
  ].join("\n");
  
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
};

export const downloadComparisonCSV = (comparisonData, filename = "city-comparison.csv") => {
  if (!comparisonData) return;

  const { city1, city2, comparison } = comparisonData;
  
  const csvContent = [
    "CITY COMPARISON REPORT",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "STUDY PARAMETERS",
    `City 1,${city1.name}`,
    `City 2,${city2.name}`,
    `Study Area,"${comparison.area} km²"`,
    "",
    "SUMMARY METRICS",
    "Metric,City 1,City 2,Difference",
    `Total Points,${city1.total},${city2.total},${comparison.totalDifference}`,
    `Density (pts/km²),${city1.density.toFixed(2)},${city2.density.toFixed(2)},${comparison.densityDifference}%`,
    `Diversity Index,${city1.diversityIndex.toFixed(3)},${city2.diversityIndex.toFixed(3)},${comparison.diversityDifference}`,
    `Spatial Pattern (NNI),${city1.spatialPattern.toFixed(3)},${city2.spatialPattern.toFixed(3)},${(city1.spatialPattern - city2.spatialPattern).toFixed(3)}`,
    "",
    "AMENITY TYPE BREAKDOWN",
    `Type,${city1.name.split(',')[0]},${city2.name.split(',')[0]}`,
    ...formatBreakdownComparison(city1.breakdown.byAmenity, city2.breakdown.byAmenity),
    "",
    ...(Object.keys(city1.breakdown.byCuisine).length > 0 ? [
      "CUISINE TYPE BREAKDOWN",
      `Cuisine,${city1.name.split(',')[0]},${city2.name.split(',')[0]}`,
      ...formatBreakdownComparison(city1.breakdown.byCuisine, city2.breakdown.byCuisine),
      ""
    ] : []),
    "Data Source: OpenStreetMap Contributors"
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
};

export const downloadDetailedComparisonCSV = (comparisonData, radius, filename = "detailed-comparison.csv") => {
  if (!comparisonData) return;

  const { city1, city2, comparison } = comparisonData;
  const area = parseFloat(comparison.area);
  
  const csvContent = [
    "DETAILED CITY COMPARISON ANALYSIS",
    `Generated: ${new Date().toLocaleString()}`,
    `Study Radius: ${(radius / 1000).toFixed(1)} km`,
    `Study Area: ${area.toFixed(2)} km²`,
    "",
    "DENSITY ANALYSIS (Per km²)",
    `Category,${city1.name.split(',')[0]} Count,${city1.name.split(',')[0]} Density,${city2.name.split(',')[0]} Count,${city2.name.split(',')[0]} Density,Density Difference`,
    ...formatDensityComparison(city1.breakdown.byAmenity, city2.breakdown.byAmenity, area),
    "",
    "SPATIAL PATTERN",
    `Metric,${city1.name.split(',')[0]},${city2.name.split(',')[0]}`,
    `Nearest Neighbor Index,${city1.spatialPattern.toFixed(3)},${city2.spatialPattern.toFixed(3)}`,
    `Pattern,${interpretNNI(city1.spatialPattern)},${interpretNNI(city2.spatialPattern)}`,
    ""
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
};

export const downloadComparisonJSON = (comparisonData, filename = "comparison-data.json") => {
  if (!comparisonData) return;
  const jsonContent = JSON.stringify(comparisonData, null, 2);
  downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
};

export const getTimestampedFilename = (baseName, extension = "csv") => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  return `${baseName}_${timestamp}.${extension}`;
};

// Helper functions
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatBreakdownComparison = (breakdown1, breakdown2) => {
  const allKeys = new Set([...Object.keys(breakdown1), ...Object.keys(breakdown2)]);
  return Array.from(allKeys)
    .sort()
    .map(key => {
      const val1 = breakdown1[key] || 0;
      const val2 = breakdown2[key] || 0;
      return `${key},${val1},${val2}`;
    });
};

const formatDensityComparison = (breakdown1, breakdown2, area) => {
  const allKeys = new Set([...Object.keys(breakdown1), ...Object.keys(breakdown2)]);
  return Array.from(allKeys)
    .sort()
    .map(key => {
      const count1 = breakdown1[key] || 0;
      const count2 = breakdown2[key] || 0;
      const density1 = (count1 / area).toFixed(2);
      const density2 = (count2 / area).toFixed(2);
      const diff = (parseFloat(density1) - parseFloat(density2)).toFixed(2);
      return `${key},${count1},${density1},${count2},${density2},${diff}`;
    });
};

const interpretNNI = (nni) => {
  if (nni < 0.8) return "Clustered";
  if (nni > 1.2) return "Dispersed";
  return "Random";
};
