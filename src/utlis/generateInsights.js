/**
 * Generate human-readable comparative insights from city analysis data
 */

export const generateComparativeInsights = (comparisonData) => {
  const { city1, city2 } = comparisonData;
  const insights = [];

  const city1Short = city1.name.split(',')[0];
  const city2Short = city2.name.split(',')[0];

  // 1. DENSITY COMPARISON
  const densityRatio = city1.density / city2.density;
  if (Math.abs(densityRatio - 1) > 0.2) {
    const higher = densityRatio > 1 ? city1Short : city2Short;
    const lower = densityRatio > 1 ? city2Short : city1Short;
    const ratio = Math.max(densityRatio, 1/densityRatio);
    const higherDensity = Math.max(city1.density, city2.density);
    const lowerDensity = Math.min(city1.density, city2.density);
    
    insights.push({
      icon: "🏙️",
      text: `<strong>${higher} has ${ratio.toFixed(1)}× higher amenity density</strong> than ${lower} (${higherDensity.toFixed(1)} vs ${lowerDensity.toFixed(1)} places/km²).`,
      type: "density",
      importance: "high"
    });
  } else {
    insights.push({
      icon: "⚖️",
      text: `<strong>Both cities have similar amenity density</strong> (~${city1.density.toFixed(1)} places/km²).`,
      type: "density",
      importance: "low"
    });
  }

  // 2. DIVERSITY COMPARISON
  const diversityDiff = Math.abs(city1.diversityIndex - city2.diversityIndex);
  if (diversityDiff > 0.2) {
    const moreDiverse = city1.diversityIndex > city2.diversityIndex ? city1Short : city2Short;
    const lessDiverse = city1.diversityIndex > city2.diversityIndex ? city2Short : city1Short;
    const higherIndex = Math.max(city1.diversityIndex, city2.diversityIndex);
    const lowerIndex = Math.min(city1.diversityIndex, city2.diversityIndex);
    
    insights.push({
      icon: "🌍",
      text: `<strong>${moreDiverse} is more diverse in amenity types</strong> (Shannon index ${higherIndex.toFixed(2)} vs ${lowerIndex.toFixed(2)}) — more variety packed into the same area.`,
      type: "diversity",
      importance: "high"
    });
  }

  // 3. SPATIAL PATTERN
  const nni1 = city1.spatialPattern;
  const nni2 = city2.spatialPattern;
  
  const pattern1 = nni1 < 0.8 ? "strongly clustered" : nni1 > 1.2 ? "widely dispersed" : "randomly distributed";
  const pattern2 = nni2 < 0.8 ? "strongly clustered" : nni2 > 1.2 ? "widely dispersed" : "randomly distributed";
  
  if (Math.abs(nni1 - nni2) > 0.3) {
    insights.push({
      icon: "📍",
      text: `<strong>${city1Short}'s amenities are ${pattern1}</strong>, while ${city2Short}'s are ${pattern2} (NNI ${nni1.toFixed(2)} vs ${nni2.toFixed(2)}).`,
      type: "spatial",
      importance: "high"
    });
  }

  // 4. SIGNATURE STRENGTHS
  const specializations = findCitySpecializations(city1, city2, city1Short, city2Short);
  insights.push(...specializations);

  // 5. CUISINE DIVERSITY
  const cuisineInsights = compareCuisines(city1, city2, city1Short, city2Short);
  if (cuisineInsights) insights.push(cuisineInsights);

  // 6. CHAINS VS INDEPENDENT
  const chainInsights = compareChains(city1, city2, city1Short, city2Short);
  if (chainInsights) insights.push(chainInsights);

  // 7. ACCESSIBILITY
  const accessInsights = compareAccessibility(city1, city2, city1Short, city2Short);
  if (accessInsights) insights.push(accessInsights);

  return insights;
};

const findCitySpecializations = (city1, city2, city1Short, city2Short) => {
  const insights = [];
  
  const shares1 = {};
  const shares2 = {};
  
  Object.entries(city1.breakdown.byAmenity).forEach(([amenity, count]) => {
    shares1[amenity] = (count / city1.total) * 100;
  });
  
  Object.entries(city2.breakdown.byAmenity).forEach(([amenity, count]) => {
    shares2[amenity] = (count / city2.total) * 100;
  });

  const differences = [];
  const allAmenities = new Set([...Object.keys(shares1), ...Object.keys(shares2)]);
  
  allAmenities.forEach(amenity => {
    const share1 = shares1[amenity] || 0;
    const share2 = shares2[amenity] || 0;
    const diff = Math.abs(share1 - share2);
    
    if (diff > 5) {
      differences.push({
        amenity,
        share1,
        share2,
        diff,
        leader: share1 > share2 ? city1Short : city2Short,
        leaderShare: Math.max(share1, share2),
        followerShare: Math.min(share1, share2)
      });
    }
  });

  differences.sort((a, b) => b.diff - a.diff);
  
  differences.slice(0, 2).forEach(item => {
    const emoji = getAmenityEmoji(item.amenity);
    const amenityName = item.amenity.replace(/_/g, ' ');
    
    insights.push({
      icon: emoji,
      text: `<strong>${item.leader} leans towards ${amenityName}</strong>: ${item.leaderShare.toFixed(0)}% of amenities vs ${item.followerShare.toFixed(0)}% in the other city.`,
      type: "specialization",
      importance: "high"
    });
  });

  return insights;
};

const compareCuisines = (city1, city2, city1Short, city2Short) => {
  const cuisines1 = Object.keys(city1.breakdown.byCuisine);
  const cuisines2 = Object.keys(city2.breakdown.byCuisine);
  
  if (cuisines1.length === 0 && cuisines2.length === 0) return null;

  const shared = cuisines1.filter(c => cuisines2.includes(c));
  const uniqueTo1 = cuisines1.filter(c => !cuisines2.includes(c));
  const uniqueTo2 = cuisines2.filter(c => !cuisines1.includes(c));

  if (uniqueTo1.length > 0 || uniqueTo2.length > 0) {
    let text = "<strong>Cuisine diversity</strong>: ";
    
    if (shared.length > 0) {
      text += `Both share ${shared.slice(0, 3).join(', ')}${shared.length > 3 ? '...' : ''}. `;
    }
    
    if (uniqueTo1.length > 0) {
      text += `${city1Short} uniquely offers ${uniqueTo1.slice(0, 2).join(', ')}${uniqueTo1.length > 2 ? ` (+${uniqueTo1.length - 2} more)` : ''}. `;
    }
    
    if (uniqueTo2.length > 0) {
      text += `${city2Short} uniquely offers ${uniqueTo2.slice(0, 2).join(', ')}${uniqueTo2.length > 2 ? ` (+${uniqueTo2.length - 2} more)` : ''}.`;
    }

    return {
      icon: "🍜",
      text,
      type: "cuisine",
      importance: "medium"
    };
  }

  return null;
};

const compareChains = (city1, city2, city1Short, city2Short) => {
  const chain1Pct = (city1.breakdown.chainsVsIndependent.chains / city1.total) * 100;
  const chain2Pct = (city2.breakdown.chainsVsIndependent.chains / city2.total) * 100;
  
  const diff = Math.abs(chain1Pct - chain2Pct);
  
  if (diff > 10) {
    const moreChains = chain1Pct > chain2Pct ? city1Short : city2Short;
    const moreIndependent = chain1Pct > chain2Pct ? city2Short : city1Short;
    const higherPct = Math.max(chain1Pct, chain2Pct);
    const lowerPct = Math.min(chain1Pct, chain2Pct);
    
    return {
      icon: "🏢",
      text: `<strong>${moreChains} has more chain businesses</strong> (${higherPct.toFixed(0)}% chains vs ${lowerPct.toFixed(0)}% in ${moreIndependent}).`,
      type: "chains",
      importance: "medium"
    };
  }
  
  return null;
};

const compareAccessibility = (city1, city2, city1Short, city2Short) => {
  const access1Pct = (city1.breakdown.accessibilityCount / city1.total) * 100;
  const access2Pct = (city2.breakdown.accessibilityCount / city2.total) * 100;
  
  const diff = Math.abs(access1Pct - access2Pct);
  
  if (diff > 5 && (access1Pct > 10 || access2Pct > 10)) {
    const moreAccessible = access1Pct > access2Pct ? city1Short : city2Short;
    const higherPct = Math.max(access1Pct, access2Pct);
    
    return {
      icon: "♿",
      text: `<strong>${moreAccessible} is more accessibility-friendly</strong> (${higherPct.toFixed(0)}% of places marked wheelchair accessible).`,
      type: "accessibility",
      importance: "medium"
    };
  }
  
  return null;
};

const getAmenityEmoji = (amenity) => {
  const emojiMap = {
    restaurant: "🍽️",
    cafe: "☕",
    bar: "🍻",
    pub: "🍺",
    fast_food: "🍔",
    hospital: "🏥",
    pharmacy: "💊",
    school: "🏫",
    university: "🎓",
    library: "📚",
    bank: "🏦",
    parking: "🅿️",
    fuel: "⛽",
    hotel: "🏨",
    cinema: "🎬",
    gym: "💪",
    place_of_worship: "⛪"
  };
  
  return emojiMap[amenity] || "📍";
};

export const calculateSimilarityScore = (city1, city2) => {
  let score = 100;
  
  const densityRatio = Math.max(city1.density, city2.density) / Math.min(city1.density, city2.density);
  score -= Math.min((densityRatio - 1) * 20, 30);
  
  const diversityDiff = Math.abs(city1.diversityIndex - city2.diversityIndex);
  score -= Math.min(diversityDiff * 15, 20);
  
  const spatialDiff = Math.abs(city1.spatialPattern - city2.spatialPattern);
  score -= Math.min(spatialDiff * 25, 25);
  
  const cuisines1 = Object.keys(city1.breakdown.byCuisine);
  const cuisines2 = Object.keys(city2.breakdown.byCuisine);
  const shared = cuisines1.filter(c => cuisines2.includes(c)).length;
  const total = new Set([...cuisines1, ...cuisines2]).size;
  const cuisineOverlap = total > 0 ? (shared / total) * 100 : 100;
  score = score * 0.75 + cuisineOverlap * 0.25;
  
  return Math.max(0, Math.min(100, score));
};