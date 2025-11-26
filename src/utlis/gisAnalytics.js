// GIS Spatial Analysis Utilities

/**
 * Calculate area of circle in square kilometers
 */
export const calculateCircleArea = (radiusMeters) => {
  return (Math.PI * Math.pow(radiusMeters, 2)) / 1_000_000; // Convert m² to km²
};

/**
 * Calculate density (points per km²)
 */
export const calculateDensity = (count, areaKm2) => {
  return count / areaKm2;
};

/**
 * Calculate diversity index (Shannon-Wiener)
 * Measures variety of types in a dataset
 */
export const calculateDiversityIndex = (categories) => {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  
  let diversity = 0;
  Object.values(categories).forEach(count => {
    if (count > 0) {
      const proportion = count / total;
      diversity -= proportion * Math.log(proportion);
    }
  });
  return diversity;
};

/**
 * Calculate nearest neighbor index (spatial distribution pattern)
 * < 1 = Clustered, ~1 = Random, > 1 = Dispersed
 */
export const calculateNearestNeighborIndex = (points, areaKm2) => {
  if (points.length < 2) return 1;
  
  let totalDistance = 0;
  let validPoints = 0;
  
  points.forEach(point => {
    let minDistance = Infinity;
    const lat1 = point.lat || point.center?.lat;
    const lon1 = point.lon || point.center?.lon;
    
    if (!lat1 || !lon1) return;
    
    points.forEach(other => {
      if (point.id !== other.id) {
        const lat2 = other.lat || other.center?.lat;
        const lon2 = other.lon || other.center?.lon;
        
        if (!lat2 || !lon2) return;
        
        const dist = haversineDistance(lat1, lon1, lat2, lon2);
        minDistance = Math.min(minDistance, dist);
      }
    });
    
    if (minDistance !== Infinity) {
      totalDistance += minDistance;
      validPoints++;
    }
  });
  
  if (validPoints === 0) return 1;
  
  const observedMean = totalDistance / validPoints;
  const expectedMean = 0.5 / Math.sqrt(validPoints / areaKm2);
  
  return observedMean / expectedMean;
};

/**
 * Haversine distance formula (km)
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Analyze amenity categories and subcategories
 */
export const analyzeAmenityBreakdown = (data) => {
  const breakdown = {
    total: data.length,
    byAmenity: {},
    byCuisine: {},
    byReligion: {},
    bySchoolType: {},
    brandCount: 0,
    chainsVsIndependent: { chains: 0, independent: 0 },
    accessibilityCount: 0,
  };

  data.forEach(item => {
    const tags = item.tags || {};
    
    // Amenity type
    const amenity = tags.amenity || 'unknown';
    breakdown.byAmenity[amenity] = (breakdown.byAmenity[amenity] || 0) + 1;
    
    // Cuisine types
    if (tags.cuisine) {
      const cuisines = tags.cuisine.split(';');
      cuisines.forEach(c => {
        const cuisine = c.trim();
        breakdown.byCuisine[cuisine] = (breakdown.byCuisine[cuisine] || 0) + 1;
      });
    }
    
    // Religion
    if (tags.religion) {
      breakdown.byReligion[tags.religion] = (breakdown.byReligion[tags.religion] || 0) + 1;
    }
    
    // School types
    if (tags['school:type']) {
      breakdown.bySchoolType[tags['school:type']] = (breakdown.bySchoolType[tags['school:type']] || 0) + 1;
    }
    
    // Brands/Chains
    if (tags.brand || tags.operator) {
      breakdown.brandCount++;
      breakdown.chainsVsIndependent.chains++;
    } else {
      breakdown.chainsVsIndependent.independent++;
    }
    
    // Accessibility
    if (tags.wheelchair === 'yes') {
      breakdown.accessibilityCount++;
    }
  });

  return breakdown;
};

/**
 * Calculate comparative metrics between two cities
 */
export const compareCityData = (city1Data, city2Data, radius) => {
  const area = calculateCircleArea(radius);
  
  const analysis1 = analyzeAmenityBreakdown(city1Data);
  const analysis2 = analyzeAmenityBreakdown(city2Data);
  
  // Density calculations
  const density1 = calculateDensity(city1Data.length, area);
  const density2 = calculateDensity(city2Data.length, area);
  
  // Diversity indices
  const diversity1 = calculateDiversityIndex(analysis1.byAmenity);
  const diversity2 = calculateDiversityIndex(analysis2.byAmenity);
  
  // Spatial distribution patterns
  const nni1 = calculateNearestNeighborIndex(city1Data, area);
  const nni2 = calculateNearestNeighborIndex(city2Data, area);
  
  // Cuisine diversity
  const cuisineDiversity1 = calculateDiversityIndex(analysis1.byCuisine);
  const cuisineDiversity2 = calculateDiversityIndex(analysis2.byCuisine);
  
  return {
    city1: {
      total: city1Data.length,
      density: density1,
      diversityIndex: diversity1,
      spatialPattern: nni1,
      cuisineDiversity: cuisineDiversity1,
      breakdown: analysis1,
    },
    city2: {
      total: city2Data.length,
      density: density2,
      diversityIndex: diversity2,
      spatialPattern: nni2,
      cuisineDiversity: cuisineDiversity2,
      breakdown: analysis2,
    },
    comparison: {
      densityDifference: density2 === 0 ? 0 : ((density1 - density2) / density2 * 100).toFixed(1),
      totalDifference: city1Data.length - city2Data.length,
      diversityDifference: (diversity1 - diversity2).toFixed(3),
      area: area.toFixed(2),
    }
  };
};

/**
 * Get top N categories with counts
 */
export const getTopCategories = (categoryObj, n = 5) => {
  return Object.entries(categoryObj)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
};

/**
 * Calculate specific cuisine density (e.g., Asian restaurants per km²)
 */
export const calculateCuisineDensity = (data, cuisineType, areaKm2) => {
  const count = data.filter(item => {
    const cuisine = item.tags?.cuisine || '';
    return cuisine.toLowerCase().includes(cuisineType.toLowerCase());
  }).length;
  
  return calculateDensity(count, areaKm2);
};

/**
 * Format spatial pattern interpretation
 */
export const interpretSpatialPattern = (nni) => {
  if (nni < 0.8) return { pattern: 'Clustered', color: 'text-orange-600', icon: '🔴' };
  if (nni > 1.2) return { pattern: 'Dispersed', color: 'text-green-600', icon: '🟢' };
  return { pattern: 'Random', color: 'text-blue-600', icon: '🔵' };
};