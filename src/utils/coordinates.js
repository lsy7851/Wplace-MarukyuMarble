/**
 * Unified Coordinate System Utilities
 *
 * Handles all coordinate-related operations:
 * - Wplace tile coordinates ↔ WGS84 lat/lng conversion
 * - URL parsing and building
 * - Coordinate validation and normalization
 * - Type conversions and utilities
 */

// ============================================================================
// Constants
// ============================================================================

/** Wplace coordinate system constants */
const WPLACE_CONSTANTS = {
  /** Meters per pixel at zoom level 11 */
  METERS_PER_PIXEL: 40075.016685578485 / 2 ** 11,

  /** Half of Earth's circumference in Web Mercator projection (meters) */
  HALF_EARTH_CIRCUMFERENCE: 20037508.342789244,

  /** Tile range */
  MIN_TILE: 0,
  MAX_TILE: 2047,

  /** Pixel offset range within tile */
  MIN_PIXEL: 0,
  MAX_PIXEL: 999,

  /** Pixels per tile */
  TILE_SIZE: 1000,

  /** Default zoom level for navigation */
  DEFAULT_ZOOM: 13.62,
};

/** WGS84 coordinate ranges */
const WGS84_RANGES = {
  MIN_LAT: -90,
  MAX_LAT: 90,
  MIN_LNG: -180,
  MAX_LNG: 180,
};

// ============================================================================
// Coordinate Conversion
// ============================================================================

/**
 * Convert Wplace tile/pixel coordinates to WGS84 latitude/longitude
 *
 * @param {number} tileX - Tile X coordinate (0-2047)
 * @param {number} tileY - Tile Y coordinate (0-2047)
 * @param {number} pixelX - Pixel X offset within tile (0-999)
 * @param {number} pixelY - Pixel Y offset within tile (0-999)
 * @returns {{lat: number, lng: number}} WGS84 coordinates
 *
 * @throws {Error} If coordinates are invalid
 *
 * @example
 * tileToLatLng(1024, 1024, 500, 500)
 * // Returns: { lat: 0.0, lng: 0.0 } (approximately center of map)
 */
export function tileToLatLng(tileX, tileY, pixelX, pixelY) {
  // Validate inputs
  if (typeof tileX !== 'number' || typeof tileY !== 'number' ||
      typeof pixelX !== 'number' || typeof pixelY !== 'number') {
    throw new Error('Invalid coordinates: all parameters must be numbers');
  }

  // Note: coordinates may be out of valid range but still process

  const { METERS_PER_PIXEL: z, HALF_EARTH_CIRCUMFERENCE: ys } = WPLACE_CONSTANTS;

  // Calculate absolute pixel position
  const absoluteX = tileX * WPLACE_CONSTANTS.TILE_SIZE + pixelX;
  const absoluteY = tileY * WPLACE_CONSTANTS.TILE_SIZE + pixelY;

  // Convert to Web Mercator meters
  const metersX = absoluteX * z - ys;
  const metersY = (ys - absoluteY * z) / ys * 180;

  // Convert to WGS84 lat/lng
  const lat = 180 / Math.PI * (2 * Math.atan(Math.exp(metersY * Math.PI / 180)) - Math.PI / 2);
  const lng = metersX / ys * 180;

  return { lat, lng };
}

/**
 * Convert WGS84 latitude/longitude to Wplace tile/pixel coordinates
 *
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @returns {{tileX: number, tileY: number, pixelX: number, pixelY: number}} Tile coordinates
 *
 * @throws {Error} If coordinates are invalid or out of range
 *
 * @example
 * latLngToTile(0.0, 0.0)
 * // Returns: { tileX: 1024, tileY: 1024, pixelX: 0, pixelY: 0 } (approximately)
 */
export function latLngToTile(lat, lng) {
  // Validate inputs
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Invalid coordinates: lat and lng must be numbers');
  }

  if (!isValidLatLng(lat, lng)) {
    throw new Error(`Coordinates out of range: lat=${lat}, lng=${lng}`);
  }

  const { METERS_PER_PIXEL: z, HALF_EARTH_CIRCUMFERENCE: ys, TILE_SIZE } = WPLACE_CONSTANTS;

  // Convert WGS84 lat/lng to Web Mercator meters
  const metersX = (lng / 180) * ys;
  const metersY = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);

  // Convert to absolute pixel position
  const absoluteX = Math.round((metersX + ys) / z);
  const absoluteY = Math.round((ys - (metersY / 180 * ys)) / z);

  // Convert to tile/pixel coordinates
  const tileX = Math.floor(absoluteX / TILE_SIZE);
  const tileY = Math.floor(absoluteY / TILE_SIZE);
  const pixelX = absoluteX % TILE_SIZE;
  const pixelY = absoluteY % TILE_SIZE;

  return { tileX, tileY, pixelX, pixelY };
}

// ============================================================================
// URL Handling
// ============================================================================

/**
 * Parse Wplace.live URL to extract coordinates
 *
 * @param {string} url - Wplace.live URL
 * @returns {{lat: number, lng: number, zoom?: number} | null} Parsed coordinates or null if invalid
 *
 * @example
 * parseWplaceUrl('https://wplace.live/?lat=-19.03&lng=-42.42&zoom=16')
 * // Returns: { lat: -19.03, lng: -42.42, zoom: 16 }
 */
export function parseWplaceUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const latMatch = url.match(/lat=([^&]+)/);
    const lngMatch = url.match(/lng=([^&]+)/);
    const zoomMatch = url.match(/zoom=([^&]+)/);

    if (!latMatch || !lngMatch) {
      return null;
    }

    const lat = parseFloat(latMatch[1]);
    const lng = parseFloat(lngMatch[1]);
    const zoom = zoomMatch ? parseFloat(zoomMatch[1]) : undefined;

    if (!isValidLatLng(lat, lng)) {
      return null;
    }

    return { lat, lng, ...(zoom !== undefined && !isNaN(zoom) && { zoom }) };

  } catch {
    return null;
  }
}

/**
 * Build Wplace.live URL from coordinates
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [zoom] - Zoom level (defaults to WPLACE_CONSTANTS.DEFAULT_ZOOM)
 * @returns {string} Wplace.live URL
 *
 * @throws {Error} If coordinates are invalid
 *
 * @example
 * buildWplaceUrl(-19.03, -42.42, 16)
 * // Returns: 'https://wplace.live/?lat=-19.03&lng=-42.42&zoom=16'
 */
export function buildWplaceUrl(lat, lng, zoom = WPLACE_CONSTANTS.DEFAULT_ZOOM) {
  if (!isValidLatLng(lat, lng)) {
    throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }

  return `https://wplace.live/?lat=${lat}&lng=${lng}&zoom=${zoom}`;
}

/**
 * Build Wplace URL search parameters string
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [zoom] - Zoom level
 * @returns {string} URL search parameters
 */
export function buildWplaceSearch(lat, lng, zoom = WPLACE_CONSTANTS.DEFAULT_ZOOM) {
  if (!isValidLatLng(lat, lng)) {
    throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }

  return `lat=${lat}&lng=${lng}&zoom=${zoom}`;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate WGS84 latitude/longitude coordinates
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
export function isValidLatLng(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  const { MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG } = WGS84_RANGES;
  return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
}

/**
 * Validate Wplace tile coordinates
 *
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @param {number} pixelX - Pixel X offset
 * @param {number} pixelY - Pixel Y offset
 * @returns {boolean} True if valid
 */
export function isValidTileCoord(tileX, tileY, pixelX, pixelY) {
  if (typeof tileX !== 'number' || typeof tileY !== 'number' ||
      typeof pixelX !== 'number' || typeof pixelY !== 'number') {
    return false;
  }

  if (isNaN(tileX) || isNaN(tileY) || isNaN(pixelX) || isNaN(pixelY)) {
    return false;
  }

  const { MIN_TILE, MAX_TILE, MIN_PIXEL, MAX_PIXEL } = WPLACE_CONSTANTS;

  return tileX >= MIN_TILE && tileX <= MAX_TILE &&
         tileY >= MIN_TILE && tileY <= MAX_TILE &&
         pixelX >= MIN_PIXEL && pixelX <= MAX_PIXEL &&
         pixelY >= MIN_PIXEL && pixelY <= MAX_PIXEL;
}

/**
 * Check if URL is a valid Wplace.live URL
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Wplace URL
 */
export function isWplaceUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return url.includes('wplace.live') || url.includes('wplace.lol');
}

// ============================================================================
// Normalization & Utilities
// ============================================================================

/**
 * Normalize coordinate object to use consistent naming (lng not lon)
 *
 * @param {Object} coords - Coordinate object with lat and lon/lng
 * @returns {{lat: number, lng: number}} Normalized coordinates
 */
export function normalizeLatLng(coords) {
  if (!coords || typeof coords !== 'object') {
    throw new Error('Invalid coordinate object');
  }

  const lat = coords.lat;
  const lng = coords.lng ?? coords.lon; // Support both lng and lon

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Coordinate object must have numeric lat and lng/lon');
  }

  return { lat, lng };
}

/**
 * Extract coordinates from various sources (URL, object, etc.)
 *
 * @param {string|Object} source - URL string or coordinate object
 * @returns {{lat: number, lng: number} | null} Extracted coordinates or null
 */
export function extractCoordinates(source) {
  if (!source) {
    return null;
  }

  // If string, try to parse as URL
  if (typeof source === 'string') {
    const parsed = parseWplaceUrl(source);
    return parsed ? { lat: parsed.lat, lng: parsed.lng } : null;
  }

  // If object, normalize it
  if (typeof source === 'object') {
    try {
      return normalizeLatLng(source);
    } catch {
      return null;
    }
  }

  return null;
}

// ============================================================================
// Exports
// ============================================================================

// Export constants for external use
export { WPLACE_CONSTANTS, WGS84_RANGES };

// Backward compatibility aliases
export const coordsToLatLng = tileToLatLng;
export const latLngToCoords = latLngToTile;
