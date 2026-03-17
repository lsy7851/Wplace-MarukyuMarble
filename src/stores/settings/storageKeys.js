/**
 * Settings Storage Keys and Defaults
 *
 * Shared constants for all settings sub-modules.
 * Storage keys use 'mm' prefix (Marukyu Marble).
 */

const KEY_PREFIX = 'mm';

export const STORAGE_KEYS = {
  // Crosshair settings
  CROSSHAIR_COLOR: `${KEY_PREFIX}CrosshairColor`,
  CROSSHAIR_BORDER: `${KEY_PREFIX}CrosshairBorder`,
  CROSSHAIR_ENHANCED_SIZE: `${KEY_PREFIX}CrosshairEnhancedSize`,
  CROSSHAIR_RADIUS: `${KEY_PREFIX}CrosshairRadius`,

  // UI settings
  MINI_TRACKER_ENABLED: `${KEY_PREFIX}MiniTrackerEnabled`,
  COLLAPSE_MIN_ENABLED: `${KEY_PREFIX}CollapseMinEnabled`,
  MOBILE_MODE: `${KEY_PREFIX}MobileMode`,
  DRAG_MODE: `${KEY_PREFIX}DragMode`,

  // Visibility settings
  SHOW_INFORMATION_HEADER: `${KEY_PREFIX}ShowInformationHeader`,
  SHOW_TEMPLATE_HEADER: `${KEY_PREFIX}ShowTemplateHeader`,
  SHOW_USERNAME: `${KEY_PREFIX}ShowUsername`,
  SHOW_DROPLETS: `${KEY_PREFIX}ShowDroplets`,
  SHOW_NEXT_LEVEL: `${KEY_PREFIX}ShowNextLevel`,
  SHOW_FULL_CHARGE: `${KEY_PREFIX}ShowFullCharge`,
  SHOW_COLOR_MENU: `${KEY_PREFIX}ShowColorMenu`,
  COLOR_MENU_HEIGHT: `${KEY_PREFIX}ColorMenuHeight`,

  // Performance settings
  TILE_REFRESH_PAUSED: `${KEY_PREFIX}TileRefreshPaused`,
  SMART_CACHE_ENABLED: `${KEY_PREFIX}SmartCacheEnabled`,
  SMART_DETECTION_ENABLED: `${KEY_PREFIX}SmartDetectionEnabled`,
  TILE_CACHE_VERSION: `${KEY_PREFIX}TileCacheVersion`,
  TILE_CACHE_STATS: `${KEY_PREFIX}TileCacheStats`,

  // Wrong color settings
  ENHANCE_WRONG_COLORS: `${KEY_PREFIX}EnhanceWrongColors`,

  // Error map settings
  ERROR_MAP_ENABLED: `${KEY_PREFIX}ErrorMapEnabled`,
  SHOW_WRONG_PIXELS: `${KEY_PREFIX}ShowWrongPixels`,
  SHOW_CORRECT_PIXELS: `${KEY_PREFIX}ShowCorrectPixels`,
  SHOW_UNPAINTED_AS_WRONG: `${KEY_PREFIX}ShowUnpaintedAsWrong`,

  // Navigation settings
  NAVIGATION_METHOD: `${KEY_PREFIX}NavigationMethod`,

  // Sorting settings
  TEMPLATE_COLOR_SORT: `${KEY_PREFIX}TemplateColorSort`,
  COMPACT_SORT: `${KEY_PREFIX}CompactSort`,
};

export const DEFAULTS = {
  // Crosshair
  crosshairColor: {
    name: 'Red',
    rgb: [255, 0, 0],
    alpha: 255,
  },
  crosshairBorder: false,
  crosshairEnhancedSize: false,
  crosshairRadius: 256,

  // UI
  miniTrackerEnabled: true,
  collapseMinEnabled: false,
  mobileMode: false,
  dragMode: true,

  // Visibility
  showInformationHeader: true,
  showTemplateHeader: true,
  showUsername: true,
  showDroplets: true,
  showNextLevel: true,
  showFullCharge: true,
  showColorMenu: true,
  colorMenuHeight: 140,

  // Performance
  tileRefreshPaused: false,
  smartCacheEnabled: true,
  smartDetectionEnabled: true,
  tileCacheVersion: '1.0',
  tileCacheStats: { hits: 0, misses: 0 },

  // Wrong color settings
  enhanceWrongColors: false,

  // Error map settings
  errorMapEnabled: false,
  showWrongPixels: true,
  showCorrectPixels: true,
  showUnpaintedAsWrong: false,

  // Navigation
  navigationMethod: 'flyto',

  // Sorting
  templateColorSort: 'default',
  compactSort: 'default',
};
