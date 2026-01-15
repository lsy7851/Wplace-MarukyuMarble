/**
 * Nominatim API - OpenStreetMap geocoding service
 * @see https://nominatim.openstreetmap.org/
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'MarukyuMarble-LocationSearch/1.0';
const DEFAULT_LIMIT = 5;

/**
 * Search for locations using Nominatim API
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} [options.limit=5] - Maximum number of results
 * @param {boolean} [options.addressdetails=true] - Include address details
 * @returns {Promise<Array>} Search results
 */
export async function searchLocation(query, options = {}) {
  const {
    limit = DEFAULT_LIMIT,
    addressdetails = true,
  } = options;

  if (!query || !query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  const params = new URLSearchParams({
    format: 'json',
    q: query.trim(),
    limit: String(limit),
    addressdetails: addressdetails ? '1' : '0',
  });

  const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

/**
 * Reverse geocode: Get location from coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} options - Options
 * @param {boolean} [options.addressdetails=true] - Include address details
 * @returns {Promise<Object>} Location data
 */
export async function reverseGeocode(lat, lon, options = {}) {
  const {
    addressdetails = true,
  } = options;

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Invalid coordinates');
  }

  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lon),
    addressdetails: addressdetails ? '1' : '0',
  });

  const url = `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

/**
 * Parse Nominatim result into standardized format
 * @param {Object} result - Raw Nominatim result
 * @returns {Object} Parsed location
 */
export function parseNominatimResult(result) {
  const displayName = result.display_name || result.name || 'Unknown location';
  const nameParts = displayName.split(',');

  return {
    lat: result.lat,
    lon: result.lon,
    displayName: displayName,
    primaryName: nameParts[0]?.trim() || 'Unknown',
    secondaryInfo: nameParts.slice(1, 3).join(',').trim(),
    fullAddress: nameParts.slice(3).join(',').trim(),
    type: result.type,
    importance: result.importance,
    boundingbox: result.boundingbox,
    raw: result,
  };
}
