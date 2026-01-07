/**
 * Template data model for Marukyu Marble
 * Represents a single pixel art template with all its metadata and tile data
 */
export class Template {
  constructor(config) {
    this.id = config.id;                    // Unique ID (timestamp or UUID)
    this.displayName = config.displayName;  // User-facing name
    this.sortID = config.sortID;            // Display order (0 = highest priority)
    this.authorID = config.authorID;        // Encoded author identifier
    this.coords = config.coords;            // [tileX, tileY, pixelX, pixelY]
    this.enabled = config.enabled ?? true;  // Visibility toggle

    // Image data
    this.file = config.file || null;        // Original File/Blob
    this.pixelCount = config.pixelCount || 0;    // Total pixels
    this.validPixelCount = config.validPixelCount || 0;    // Non-transparent
    this.transparentPixelCount = config.transparentPixelCount || 0;

    // Tile data - stored in IndexedDB separately
    // this.templateTiles = Map<tileKey, ImageBitmap>  (NOT stored here)
    // this.templateTilesBuffers = Map<tileKey, Blob>  (in IndexedDB)

    // Color filtering
    this.disabledColors = new Set(config.disabledColors || []);  // Set<"r,g,b">
    this.enhancedColors = new Set(config.enhancedColors || []);  // Set<"r,g,b">
    this.colorPalette = config.colorPalette || {};  // {"r,g,b": {count, enabled}}

    // Metadata
    this.createdAt = config.createdAt || new Date().toISOString();
    this.updatedAt = config.updatedAt || new Date().toISOString();
  }

  // Tile size constant
  static TILE_SIZE = 1000;
  static SHREAD_SIZE = 3;  // MUST be odd number

  /**
   * Serialization for chrome.storage.sync (metadata only, no blobs)
   */
  toJSON() {
    return {
      id: this.id,
      displayName: this.displayName,
      sortID: this.sortID,
      authorID: this.authorID,
      coords: this.coords,
      enabled: this.enabled,
      pixelCount: this.pixelCount,
      validPixelCount: this.validPixelCount,
      transparentPixelCount: this.transparentPixelCount,
      disabledColors: Array.from(this.disabledColors),
      enhancedColors: Array.from(this.enhancedColors),
      colorPalette: this.colorPalette,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Restore from JSON
   */
  static fromJSON(json) {
    return new Template(json);
  }

  // ========== Color Filtering Methods ==========

  /**
   * Disable a color (make it invisible in rendering)
   * @param {[number, number, number]} rgb - [r, g, b] array
   */
  disableColor([r, g, b]) {
    this.disabledColors.add(`${r},${g},${b}`);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Enable a color (make it visible in rendering)
   * @param {[number, number, number]} rgb - [r, g, b] array
   */
  enableColor([r, g, b]) {
    this.disabledColors.delete(`${r},${g},${b}`);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Check if a color is disabled
   * @param {[number, number, number]} rgb - [r, g, b] array
   * @returns {boolean}
   */
  isColorDisabled([r, g, b]) {
    return this.disabledColors.has(`${r},${g},${b}`);
  }

  /**
   * Get all disabled colors
   * @returns {string[]} Array of "r,g,b" strings
   */
  getDisabledColors() {
    return Array.from(this.disabledColors);
  }

  /**
   * Set disabled colors in bulk
   * @param {string[]} colorKeys - Array of "r,g,b" strings
   */
  setDisabledColors(colorKeys) {
    this.disabledColors = new Set(colorKeys);
    this.updatedAt = new Date().toISOString();
  }

  // ========== Enhanced Color Methods ==========

  /**
   * Enable enhanced mode for a color (show crosshair)
   * @param {[number, number, number]} rgb - [r, g, b] array
   */
  enableColorEnhanced([r, g, b]) {
    this.enhancedColors.add(`${r},${g},${b}`);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Disable enhanced mode for a color
   * @param {[number, number, number]} rgb - [r, g, b] array
   */
  disableColorEnhanced([r, g, b]) {
    this.enhancedColors.delete(`${r},${g},${b}`);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Check if a color is enhanced
   * @param {[number, number, number]} rgb - [r, g, b] array
   * @returns {boolean}
   */
  isColorEnhanced([r, g, b]) {
    return this.enhancedColors.has(`${r},${g},${b}`);
  }

  /**
   * Get all enhanced colors
   * @returns {string[]} Array of "r,g,b" strings
   */
  getEnhancedColors() {
    return Array.from(this.enhancedColors);
  }

  /**
   * Set enhanced colors in bulk
   * @param {string[]} colorKeys - Array of "r,g,b" strings
   */
  setEnhancedColors(colorKeys) {
    this.enhancedColors = new Set(colorKeys);
    this.updatedAt = new Date().toISOString();
  }

  // ========== Tile Key Utilities ==========

  /**
   * Get tile key from coordinates
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @param {number} pixelX - Pixel X offset (0-999)
   * @param {number} pixelY - Pixel Y offset (0-999)
   * @returns {string} Tile key in format "XXXX,YYYY,XXX,YYY"
   */
  static getTileKey(tileX, tileY, pixelX, pixelY) {
    return `${String(tileX).padStart(4, '0')},${String(tileY).padStart(4, '0')},${String(pixelX).padStart(3, '0')},${String(pixelY).padStart(3, '0')}`;
  }

  /**
   * Parse tile key to coordinates
   * @param {string} key - Tile key in format "XXXX,YYYY,XXX,YYY"
   * @returns {{tileX: number, tileY: number, pixelX: number, pixelY: number}}
   */
  static parseTileKey(key) {
    const [tileX, tileY, pixelX, pixelY] = key.split(',').map(Number);
    return { tileX, tileY, pixelX, pixelY };
  }

  /**
   * Validate coordinate ranges
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @param {number} pixelX - Pixel X offset
   * @param {number} pixelY - Pixel Y offset
   * @returns {boolean}
   */
  static validateCoordinates(tileX, tileY, pixelX, pixelY) {
    return (
      tileX >= 0 && tileX <= 2047 &&
      tileY >= 0 && tileY <= 2047 &&
      pixelX >= 0 && pixelX <= 999 &&
      pixelY >= 0 && pixelY <= 999
    );
  }
}
