/**
 * Settings Store
 *
 * Central state management for all Marukyu Marble settings
 * Uses chrome.storage.sync for cross-device synchronization
 *
 * Storage keys use 'mm' prefix (Marukyu Marble)
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { chromeStorageCompat } from '@/utils/storageCompat.js';

// Storage key prefix
const KEY_PREFIX = 'mm';

// Storage keys
const STORAGE_KEYS = {
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

// Default values
const DEFAULTS = {
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
  dragMode: true, // true = full overlay drag, false = drag bar only

  // Visibility
  showInformationHeader: true,
  showTemplateHeader: true,
  showUsername: true,
  showDroplets: true,
  showNextLevel: true,
  showFullCharge: true,
  showColorMenu: true,
  colorMenuHeight: 140, // default height in pixels

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
  navigationMethod: 'flyto', // 'flyto' | 'openurl'

  // Sorting
  templateColorSort: 'default',
  compactSort: 'default',
};

export const useSettingsStore = defineStore('settings', () => {
  // ========================================
  // State
  // ========================================

  // Crosshair settings
  const crosshairColor = ref({ ...DEFAULTS.crosshairColor });
  const crosshairBorder = ref(DEFAULTS.crosshairBorder);
  const crosshairEnhancedSize = ref(DEFAULTS.crosshairEnhancedSize);
  const crosshairRadius = ref(DEFAULTS.crosshairRadius);

  // UI settings
  const miniTrackerEnabled = ref(DEFAULTS.miniTrackerEnabled);
  const collapseMinEnabled = ref(DEFAULTS.collapseMinEnabled);
  const mobileMode = ref(DEFAULTS.mobileMode);
  const dragMode = ref(DEFAULTS.dragMode);

  // Visibility settings
  const showInformationHeader = ref(DEFAULTS.showInformationHeader);
  const showTemplateHeader = ref(DEFAULTS.showTemplateHeader);
  const showUsername = ref(DEFAULTS.showUsername);
  const showDroplets = ref(DEFAULTS.showDroplets);
  const showNextLevel = ref(DEFAULTS.showNextLevel);
  const showFullCharge = ref(DEFAULTS.showFullCharge);
  const showColorMenu = ref(DEFAULTS.showColorMenu);
  const colorMenuHeight = ref(DEFAULTS.colorMenuHeight);

  // Performance settings
  const tileRefreshPaused = ref(DEFAULTS.tileRefreshPaused);
  const smartCacheEnabled = ref(DEFAULTS.smartCacheEnabled);
  const smartDetectionEnabled = ref(DEFAULTS.smartDetectionEnabled);
  const tileCacheVersion = ref(DEFAULTS.tileCacheVersion);
  const tileCacheStats = ref({ ...DEFAULTS.tileCacheStats });

  // Wrong color settings
  const enhanceWrongColors = ref(DEFAULTS.enhanceWrongColors);

  // Error map settings
  const errorMapEnabled = ref(DEFAULTS.errorMapEnabled);
  const showWrongPixels = ref(DEFAULTS.showWrongPixels);
  const showCorrectPixels = ref(DEFAULTS.showCorrectPixels);
  const showUnpaintedAsWrong = ref(DEFAULTS.showUnpaintedAsWrong);

  // Navigation settings
  const navigationMethod = ref(DEFAULTS.navigationMethod);

  // Sorting settings
  const templateColorSort = ref(DEFAULTS.templateColorSort);
  const compactSort = ref(DEFAULTS.compactSort);

  // Initialization flag
  const isInitialized = ref(false);

  // ========================================
  // Actions
  // ========================================

  /**
   * Load all settings from chrome.storage.sync
   */
  async function loadSettings() {
    try {
      const storageKeys = Object.values(STORAGE_KEYS);
      const result = await chromeStorageCompat.sync.get(storageKeys);

      // Crosshair settings
      if (result[STORAGE_KEYS.CROSSHAIR_COLOR]) {
        crosshairColor.value = result[STORAGE_KEYS.CROSSHAIR_COLOR];
      }
      if (result[STORAGE_KEYS.CROSSHAIR_BORDER] !== undefined) {
        crosshairBorder.value = result[STORAGE_KEYS.CROSSHAIR_BORDER];
      }
      if (result[STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE] !== undefined) {
        crosshairEnhancedSize.value = result[STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE];
      }
      if (result[STORAGE_KEYS.CROSSHAIR_RADIUS] !== undefined) {
        crosshairRadius.value = result[STORAGE_KEYS.CROSSHAIR_RADIUS];
      }

      // UI settings
      if (result[STORAGE_KEYS.MINI_TRACKER_ENABLED] !== undefined) {
        miniTrackerEnabled.value = result[STORAGE_KEYS.MINI_TRACKER_ENABLED];
      }
      if (result[STORAGE_KEYS.COLLAPSE_MIN_ENABLED] !== undefined) {
        collapseMinEnabled.value = result[STORAGE_KEYS.COLLAPSE_MIN_ENABLED];
      }
      if (result[STORAGE_KEYS.MOBILE_MODE] !== undefined) {
        mobileMode.value = result[STORAGE_KEYS.MOBILE_MODE];
      }
      if (result[STORAGE_KEYS.DRAG_MODE] !== undefined) {
        dragMode.value = result[STORAGE_KEYS.DRAG_MODE];
      }

      // Visibility settings
      if (result[STORAGE_KEYS.SHOW_INFORMATION_HEADER] !== undefined) {
        showInformationHeader.value = result[STORAGE_KEYS.SHOW_INFORMATION_HEADER];
      }
      if (result[STORAGE_KEYS.SHOW_TEMPLATE_HEADER] !== undefined) {
        showTemplateHeader.value = result[STORAGE_KEYS.SHOW_TEMPLATE_HEADER];
      }
      if (result[STORAGE_KEYS.SHOW_USERNAME] !== undefined) {
        showUsername.value = result[STORAGE_KEYS.SHOW_USERNAME];
      }
      if (result[STORAGE_KEYS.SHOW_DROPLETS] !== undefined) {
        showDroplets.value = result[STORAGE_KEYS.SHOW_DROPLETS];
      }
      if (result[STORAGE_KEYS.SHOW_NEXT_LEVEL] !== undefined) {
        showNextLevel.value = result[STORAGE_KEYS.SHOW_NEXT_LEVEL];
      }
      if (result[STORAGE_KEYS.SHOW_FULL_CHARGE] !== undefined) {
        showFullCharge.value = result[STORAGE_KEYS.SHOW_FULL_CHARGE];
      }
      if (result[STORAGE_KEYS.SHOW_COLOR_MENU] !== undefined) {
        showColorMenu.value = result[STORAGE_KEYS.SHOW_COLOR_MENU];
      }
      if (result[STORAGE_KEYS.COLOR_MENU_HEIGHT] !== undefined) {
        colorMenuHeight.value = result[STORAGE_KEYS.COLOR_MENU_HEIGHT];
      }

      // Performance settings
      if (result[STORAGE_KEYS.TILE_REFRESH_PAUSED] !== undefined) {
        tileRefreshPaused.value = result[STORAGE_KEYS.TILE_REFRESH_PAUSED];
      }
      if (result[STORAGE_KEYS.SMART_CACHE_ENABLED] !== undefined) {
        smartCacheEnabled.value = result[STORAGE_KEYS.SMART_CACHE_ENABLED];
      }
      if (result[STORAGE_KEYS.SMART_DETECTION_ENABLED] !== undefined) {
        smartDetectionEnabled.value = result[STORAGE_KEYS.SMART_DETECTION_ENABLED];
      }
      if (result[STORAGE_KEYS.TILE_CACHE_VERSION] !== undefined) {
        tileCacheVersion.value = result[STORAGE_KEYS.TILE_CACHE_VERSION];
      }
      if (result[STORAGE_KEYS.TILE_CACHE_STATS] !== undefined) {
        tileCacheStats.value = result[STORAGE_KEYS.TILE_CACHE_STATS];
      }

      // Wrong color settings
      if (result[STORAGE_KEYS.ENHANCE_WRONG_COLORS] !== undefined) {
        enhanceWrongColors.value = result[STORAGE_KEYS.ENHANCE_WRONG_COLORS];
      }

      // Error map settings
      if (result[STORAGE_KEYS.ERROR_MAP_ENABLED] !== undefined) {
        errorMapEnabled.value = result[STORAGE_KEYS.ERROR_MAP_ENABLED];
      }
      if (result[STORAGE_KEYS.SHOW_WRONG_PIXELS] !== undefined) {
        showWrongPixels.value = result[STORAGE_KEYS.SHOW_WRONG_PIXELS];
      }
      if (result[STORAGE_KEYS.SHOW_CORRECT_PIXELS] !== undefined) {
        showCorrectPixels.value = result[STORAGE_KEYS.SHOW_CORRECT_PIXELS];
      }
      if (result[STORAGE_KEYS.SHOW_UNPAINTED_AS_WRONG] !== undefined) {
        showUnpaintedAsWrong.value = result[STORAGE_KEYS.SHOW_UNPAINTED_AS_WRONG];
      }

      // Navigation settings
      if (result[STORAGE_KEYS.NAVIGATION_METHOD] !== undefined) {
        navigationMethod.value = result[STORAGE_KEYS.NAVIGATION_METHOD];
      }

      // Sorting settings
      if (result[STORAGE_KEYS.TEMPLATE_COLOR_SORT] !== undefined) {
        templateColorSort.value = result[STORAGE_KEYS.TEMPLATE_COLOR_SORT];
      }
      if (result[STORAGE_KEYS.COMPACT_SORT] !== undefined) {
        compactSort.value = result[STORAGE_KEYS.COMPACT_SORT];
      }

      isInitialized.value = true;
    } catch {
      isInitialized.value = true;
    }
  }

  /**
   * Save all settings to chrome.storage.sync
   */
  async function saveAllSettings() {
    try {
      // Deep clone to plain objects (remove Vue reactivity proxies)
      const plainSettings = {
        [STORAGE_KEYS.CROSSHAIR_COLOR]: JSON.parse(JSON.stringify(crosshairColor.value)),
        [STORAGE_KEYS.CROSSHAIR_BORDER]: crosshairBorder.value,
        [STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE]: crosshairEnhancedSize.value,
        [STORAGE_KEYS.CROSSHAIR_RADIUS]: crosshairRadius.value,

        [STORAGE_KEYS.MINI_TRACKER_ENABLED]: miniTrackerEnabled.value,
        [STORAGE_KEYS.COLLAPSE_MIN_ENABLED]: collapseMinEnabled.value,
        [STORAGE_KEYS.MOBILE_MODE]: mobileMode.value,
        [STORAGE_KEYS.DRAG_MODE]: dragMode.value,

        [STORAGE_KEYS.SHOW_INFORMATION_HEADER]: showInformationHeader.value,
        [STORAGE_KEYS.SHOW_TEMPLATE_HEADER]: showTemplateHeader.value,
        [STORAGE_KEYS.SHOW_USERNAME]: showUsername.value,
        [STORAGE_KEYS.SHOW_DROPLETS]: showDroplets.value,
        [STORAGE_KEYS.SHOW_NEXT_LEVEL]: showNextLevel.value,
        [STORAGE_KEYS.SHOW_FULL_CHARGE]: showFullCharge.value,
        [STORAGE_KEYS.SHOW_COLOR_MENU]: showColorMenu.value,
        [STORAGE_KEYS.COLOR_MENU_HEIGHT]: colorMenuHeight.value,

        [STORAGE_KEYS.TILE_REFRESH_PAUSED]: tileRefreshPaused.value,
        [STORAGE_KEYS.SMART_CACHE_ENABLED]: smartCacheEnabled.value,
        [STORAGE_KEYS.SMART_DETECTION_ENABLED]: smartDetectionEnabled.value,
        [STORAGE_KEYS.TILE_CACHE_VERSION]: tileCacheVersion.value,
        [STORAGE_KEYS.TILE_CACHE_STATS]: JSON.parse(JSON.stringify(tileCacheStats.value)),

        [STORAGE_KEYS.ENHANCE_WRONG_COLORS]: enhanceWrongColors.value,

        [STORAGE_KEYS.ERROR_MAP_ENABLED]: errorMapEnabled.value,
        [STORAGE_KEYS.SHOW_WRONG_PIXELS]: showWrongPixels.value,
        [STORAGE_KEYS.SHOW_CORRECT_PIXELS]: showCorrectPixels.value,
        [STORAGE_KEYS.SHOW_UNPAINTED_AS_WRONG]: showUnpaintedAsWrong.value,

        [STORAGE_KEYS.NAVIGATION_METHOD]: navigationMethod.value,

        [STORAGE_KEYS.TEMPLATE_COLOR_SORT]: templateColorSort.value,
        [STORAGE_KEYS.COMPACT_SORT]: compactSort.value,
      };

      await chromeStorageCompat.sync.set(plainSettings);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save individual setting
   * @param {string} key - Storage key
   * @param {*} value - Setting value
   */
  async function saveSetting(key, value) {
    try {
      // Deep clone to plain object (remove Vue reactivity proxies)
      const plainValue = typeof value === 'object' && value !== null
        ? JSON.parse(JSON.stringify(value))
        : value;

      await chromeStorageCompat.sync.set({ [key]: plainValue });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update crosshair color
   * @param {Object} color - Color object { name, rgb, alpha, isCustom? }
   */
  async function updateCrosshairColor(color) {
    crosshairColor.value = color;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_COLOR, color);
  }

  /**
   * Update crosshair border
   * @param {boolean} enabled
   */
  async function updateCrosshairBorder(enabled) {
    crosshairBorder.value = enabled;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_BORDER, enabled);
  }

  /**
   * Update crosshair enhanced size
   * @param {boolean} enabled
   */
  async function updateCrosshairEnhancedSize(enabled) {
    crosshairEnhancedSize.value = enabled;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE, enabled);
  }

  /**
   * Update crosshair radius
   * @param {number} radius
   */
  async function updateCrosshairRadius(radius) {
    crosshairRadius.value = radius;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_RADIUS, radius);
  }

  /**
   * Update mini tracker enabled
   * @param {boolean} enabled
   */
  async function updateMiniTrackerEnabled(enabled) {
    miniTrackerEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.MINI_TRACKER_ENABLED, enabled);
  }

  /**
   * Update collapse min enabled
   * @param {boolean} enabled
   */
  async function updateCollapseMinEnabled(enabled) {
    collapseMinEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.COLLAPSE_MIN_ENABLED, enabled);
  }

  /**
   * Update mobile mode
   * @param {boolean} enabled
   */
  async function updateMobileMode(enabled) {
    mobileMode.value = enabled;
    await saveSetting(STORAGE_KEYS.MOBILE_MODE, enabled);
  }

  /**
   * Update drag mode
   * @param {boolean} enabled
   */
  async function updateDragMode(enabled) {
    dragMode.value = enabled;
    await saveSetting(STORAGE_KEYS.DRAG_MODE, enabled);
  }

  /**
   * Update show username
   * @param {boolean} enabled
   */
  async function updateShowUsername(enabled) {
    showUsername.value = enabled;
    await saveSetting(STORAGE_KEYS.SHOW_USERNAME, enabled);
  }

  /**
   * Update tile refresh paused
   * @param {boolean} paused
   */
  async function updateTileRefreshPaused(paused) {
    tileRefreshPaused.value = paused;
    await saveSetting(STORAGE_KEYS.TILE_REFRESH_PAUSED, paused);
  }

  /**
   * Update smart cache enabled
   * @param {boolean} enabled
   */
  async function updateSmartCacheEnabled(enabled) {
    smartCacheEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.SMART_CACHE_ENABLED, enabled);
  }

  /**
   * Update smart detection enabled
   * @param {boolean} enabled
   */
  async function updateSmartDetectionEnabled(enabled) {
    smartDetectionEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.SMART_DETECTION_ENABLED, enabled);
  }

  /**
   * Update enhance wrong colors
   * @param {boolean} enabled
   */
  async function updateEnhanceWrongColors(enabled) {
    enhanceWrongColors.value = enabled;
    await saveSetting(STORAGE_KEYS.ENHANCE_WRONG_COLORS, enabled);
  }

  /**
   * Update error map enabled
   * @param {boolean} enabled
   */
  async function updateErrorMapEnabled(enabled) {
    errorMapEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.ERROR_MAP_ENABLED, enabled);
  }

  /**
   * Toggle error map mode on/off
   * @returns {boolean} New state
   */
  async function toggleErrorMapMode() {
    const newState = !errorMapEnabled.value;
    await updateErrorMapEnabled(newState);
    return newState;
  }

  /**
   * Update navigation method
   * @param {'flyto' | 'openurl'} method
   */
  async function updateNavigationMethod(method) {
    navigationMethod.value = method;
    await saveSetting(STORAGE_KEYS.NAVIGATION_METHOD, method);
  }

  /**
   * Update template color sort
   * @param {string} sort
   */
  async function updateTemplateColorSort(sort) {
    templateColorSort.value = sort;
    await saveSetting(STORAGE_KEYS.TEMPLATE_COLOR_SORT, sort);
  }

  /**
   * Update compact sort
   * @param {string} sort
   */
  async function updateCompactSort(sort) {
    compactSort.value = sort;
    await saveSetting(STORAGE_KEYS.COMPACT_SORT, sort);
  }

  /**
   * Update color menu height
   * @param {number} height
   */
  async function updateColorMenuHeight(height) {
    colorMenuHeight.value = height;
    await saveSetting(STORAGE_KEYS.COLOR_MENU_HEIGHT, height);
  }

  /**
   * Update tile cache version
   * @param {string} version
   */
  async function updateTileCacheVersion(version) {
    tileCacheVersion.value = version;
    await saveSetting(STORAGE_KEYS.TILE_CACHE_VERSION, version);
  }

  /**
   * Update tile cache stats
   * @param {Object} stats - { hits, misses }
   */
  async function updateTileCacheStats(stats) {
    tileCacheStats.value = stats;
    await saveSetting(STORAGE_KEYS.TILE_CACHE_STATS, stats);
  }

  /**
   * Apply bulk settings (used by settings modal)
   * @param {Object} settings - Settings object
   */
  async function applySettings(settings) {
    try {
      // Update all refs
      crosshairColor.value = settings.crosshairColor;
      crosshairBorder.value = settings.crosshairBorder;
      crosshairEnhancedSize.value = settings.crosshairEnhancedSize;
      crosshairRadius.value = settings.crosshairRadius;

      miniTrackerEnabled.value = settings.miniTrackerEnabled;
      collapseMinEnabled.value = settings.collapseMinEnabled;
      mobileMode.value = settings.mobileMode;
      dragMode.value = settings.dragMode;

      showInformationHeader.value = settings.showInformationHeader;
      showTemplateHeader.value = settings.showTemplateHeader;
      showUsername.value = settings.showUsername;
      showDroplets.value = settings.showDroplets;
      showNextLevel.value = settings.showNextLevel;
      showFullCharge.value = settings.showFullCharge;
      showColorMenu.value = settings.showColorMenu;

      tileRefreshPaused.value = settings.tileRefreshPaused;
      smartCacheEnabled.value = settings.smartCacheEnabled;
      smartDetectionEnabled.value = settings.smartDetectionEnabled;

      enhanceWrongColors.value = settings.enhanceWrongColors;

      errorMapEnabled.value = settings.errorMapEnabled;
      showWrongPixels.value = settings.showWrongPixels;
      showCorrectPixels.value = settings.showCorrectPixels;
      showUnpaintedAsWrong.value = settings.showUnpaintedAsWrong;

      navigationMethod.value = settings.navigationMethod;

      templateColorSort.value = settings.templateColorSort;
      compactSort.value = settings.compactSort;

      // Save all to storage
      await saveAllSettings();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset all settings to defaults
   */
  async function resetSettings() {
    try {
      crosshairColor.value = { ...DEFAULTS.crosshairColor };
      crosshairBorder.value = DEFAULTS.crosshairBorder;
      crosshairEnhancedSize.value = DEFAULTS.crosshairEnhancedSize;
      crosshairRadius.value = DEFAULTS.crosshairRadius;

      miniTrackerEnabled.value = DEFAULTS.miniTrackerEnabled;
      collapseMinEnabled.value = DEFAULTS.collapseMinEnabled;
      mobileMode.value = DEFAULTS.mobileMode;
      dragMode.value = DEFAULTS.dragMode;

      showInformationHeader.value = DEFAULTS.showInformationHeader;
      showTemplateHeader.value = DEFAULTS.showTemplateHeader;
      showUsername.value = DEFAULTS.showUsername;
      showDroplets.value = DEFAULTS.showDroplets;
      showNextLevel.value = DEFAULTS.showNextLevel;
      showFullCharge.value = DEFAULTS.showFullCharge;
      showColorMenu.value = DEFAULTS.showColorMenu;

      tileRefreshPaused.value = DEFAULTS.tileRefreshPaused;
      smartCacheEnabled.value = DEFAULTS.smartCacheEnabled;
      smartDetectionEnabled.value = DEFAULTS.smartDetectionEnabled;

      enhanceWrongColors.value = DEFAULTS.enhanceWrongColors;

      errorMapEnabled.value = DEFAULTS.errorMapEnabled;
      showWrongPixels.value = DEFAULTS.showWrongPixels;
      showCorrectPixels.value = DEFAULTS.showCorrectPixels;
      showUnpaintedAsWrong.value = DEFAULTS.showUnpaintedAsWrong;

      navigationMethod.value = DEFAULTS.navigationMethod;

      templateColorSort.value = DEFAULTS.templateColorSort;
      compactSort.value = DEFAULTS.compactSort;

      await saveAllSettings();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current settings as plain object
   */
  function getCurrentSettings() {
    return {
      crosshairColor: crosshairColor.value,
      crosshairBorder: crosshairBorder.value,
      crosshairEnhancedSize: crosshairEnhancedSize.value,
      crosshairRadius: crosshairRadius.value,

      miniTrackerEnabled: miniTrackerEnabled.value,
      collapseMinEnabled: collapseMinEnabled.value,
      mobileMode: mobileMode.value,
      dragMode: dragMode.value,

      showInformationHeader: showInformationHeader.value,
      showTemplateHeader: showTemplateHeader.value,
      showUsername: showUsername.value,
      showDroplets: showDroplets.value,
      showNextLevel: showNextLevel.value,
      showFullCharge: showFullCharge.value,
      showColorMenu: showColorMenu.value,

      tileRefreshPaused: tileRefreshPaused.value,
      smartCacheEnabled: smartCacheEnabled.value,
      smartDetectionEnabled: smartDetectionEnabled.value,

      enhanceWrongColors: enhanceWrongColors.value,

      errorMapEnabled: errorMapEnabled.value,
      showWrongPixels: showWrongPixels.value,
      showCorrectPixels: showCorrectPixels.value,
      showUnpaintedAsWrong: showUnpaintedAsWrong.value,

      navigationMethod: navigationMethod.value,

      templateColorSort: templateColorSort.value,
      compactSort: compactSort.value,
    };
  }

  // ========================================
  // Initialize on store creation
  // ========================================

  // Auto-load settings when store is created
  if (!isInitialized.value) {
    loadSettings();
  }

  return {
    // State
    crosshairColor,
    crosshairBorder,
    crosshairEnhancedSize,
    crosshairRadius,

    miniTrackerEnabled,
    collapseMinEnabled,
    mobileMode,
    dragMode,

    showInformationHeader,
    showTemplateHeader,
    showUsername,
    showDroplets,
    showNextLevel,
    showFullCharge,
    showColorMenu,
    colorMenuHeight,

    tileRefreshPaused,
    smartCacheEnabled,
    smartDetectionEnabled,
    tileCacheVersion,
    tileCacheStats,

    enhanceWrongColors,

    errorMapEnabled,
    showWrongPixels,
    showCorrectPixels,
    showUnpaintedAsWrong,

    navigationMethod,

    templateColorSort,
    compactSort,

    isInitialized,

    // Actions
    loadSettings,
    saveAllSettings,
    saveSetting,

    updateCrosshairColor,
    updateCrosshairBorder,
    updateCrosshairEnhancedSize,
    updateCrosshairRadius,

    updateMiniTrackerEnabled,
    updateCollapseMinEnabled,
    updateMobileMode,
    updateDragMode,
    updateShowUsername,

    updateTileRefreshPaused,
    updateSmartCacheEnabled,
    updateSmartDetectionEnabled,

    updateEnhanceWrongColors,

    updateErrorMapEnabled,
    toggleErrorMapMode,

    updateNavigationMethod,

    updateTemplateColorSort,
    updateCompactSort,
    updateColorMenuHeight,
    updateTileCacheVersion,
    updateTileCacheStats,

    applySettings,
    resetSettings,
    getCurrentSettings,
  };
});
