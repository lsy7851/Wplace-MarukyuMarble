/**
 * URL Parser - Parse Wplace.live URLs to extract coordinates
 */

/**
 * Parse Wplace.live URL to extract coordinates
 * @param {string} url - Wplace.live URL
 * @returns {{lat: number, lng: number, zoom: number} | null} Parsed coordinates or null if invalid
 *
 * @example
 * parseWplaceUrl('https://wplace.live/?lat=-19.037942104984218&lng=-42.420498378222675&zoom=16.078281108991245')
 * // Returns: { lat: -19.037942104984218, lng: -42.420498378222675, zoom: 16.078281108991245 }
 */
export function parseWplaceUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Match lat and lng from URL
    const latMatch = url.match(/lat=([^&]+)/);
    const lngMatch = url.match(/lng=([^&]+)/);
    const zoomMatch = url.match(/zoom=([^&]+)/);

    if (!latMatch || !lngMatch) {
      console.warn('⚠️ [urlParser] URL does not contain lat/lng parameters');
      return null;
    }

    const lat = parseFloat(latMatch[1]);
    const lng = parseFloat(lngMatch[1]);
    const zoom = zoomMatch ? parseFloat(zoomMatch[1]) : null;

    // Validate numbers
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('⚠️ [urlParser] Invalid lat/lng values');
      return null;
    }

    // Validate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('⚠️ [urlParser] Lat/lng out of valid range');
      return null;
    }

    console.log('✅ [urlParser] Parsed coordinates:', { lat, lng, zoom });

    return {
      lat,
      lng,
      zoom: zoom !== null && !isNaN(zoom) ? zoom : undefined,
    };

  } catch (error) {
    console.error('❌ [urlParser] Failed to parse URL:', error);
    return null;
  }
}

/**
 * Build Wplace.live URL from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [zoom=13.62] - Zoom level
 * @returns {string} Wplace.live URL
 *
 * @example
 * buildWplaceUrl(-19.037942, -42.420498, 16)
 * // Returns: 'https://wplace.live/?lat=-19.037942&lng=-42.420498&zoom=16'
 */
export function buildWplaceUrl(lat, lng, zoom = 13.62) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Invalid coordinates: lat and lng must be numbers');
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Coordinates out of range');
  }

  const url = `https://wplace.live/?lat=${lat}&lng=${lng}&zoom=${zoom}`;
  console.log('🔗 [urlParser] Built URL:', url);
  return url;
}


export function buildWplaceSearch(lat, lng, zoom = 13.62) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Invalid coordinates: lat and lng must be numbers');
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Coordinates out of range');
  }

  const url = `lat=${lat}&lng=${lng}&zoom=${zoom}`;
  console.log('🔗 [urlParser] Built URL:', url);
  return url;
}

/**
 * Validate if string is a Wplace.live URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Wplace.live URL
 */
export function isWplaceUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return url.includes('wplace.live') || url.includes('wplace.lol');
}

/**
 * Extract coordinates from various URL formats
 * @param {string} url - URL string
 * @returns {{lat: number, lng: number} | null} Coordinates or null
 */
export function extractCoordinates(url) {
  const parsed = parseWplaceUrl(url);
  if (parsed) {
    return { lat: parsed.lat, lng: parsed.lng };
  }
  return null;
}
