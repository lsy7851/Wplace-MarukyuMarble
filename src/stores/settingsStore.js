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
  SHOW_USERNAME: `${KEY_PREFIX}ShowUsername`,

  // Performance settings
  TILE_REFRESH_PAUSED: `${KEY_PREFIX}TileRefreshPaused`,
  SMART_CACHE_ENABLED: `${KEY_PREFIX}SmartCacheEnabled`,
  SMART_DETECTION_ENABLED: `${KEY_PREFIX}SmartDetectionEnabled`,

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
  showUsername: true,

  // Performance
  tileRefreshPaused: false,
  smartCacheEnabled: true,
  smartDetectionEnabled: true,

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
  const showUsername = ref(DEFAULTS.showUsername);

  // Performance settings
  const tileRefreshPaused = ref(DEFAULTS.tileRefreshPaused);
  const smartCacheEnabled = ref(DEFAULTS.smartCacheEnabled);
  const smartDetectionEnabled = ref(DEFAULTS.smartDetectionEnabled);

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

      console.log(result);

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
      if (result[STORAGE_KEYS.SHOW_USERNAME] !== undefined) {
        showUsername.value = result[STORAGE_KEYS.SHOW_USERNAME];
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
      console.log('✅ Settings loaded from chrome.storage.sync');
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      // Use defaults on error
      isInitialized.value = true;
    }
  }

  /**
   * Save all settings to chrome.storage.sync
   */
  async function saveAllSettings() {
    try {
      await chromeStorageCompat.sync.set({
        [STORAGE_KEYS.CROSSHAIR_COLOR]: crosshairColor.value,
        [STORAGE_KEYS.CROSSHAIR_BORDER]: crosshairBorder.value,
        [STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE]: crosshairEnhancedSize.value,
        [STORAGE_KEYS.CROSSHAIR_RADIUS]: crosshairRadius.value,

        [STORAGE_KEYS.MINI_TRACKER_ENABLED]: miniTrackerEnabled.value,
        [STORAGE_KEYS.COLLAPSE_MIN_ENABLED]: collapseMinEnabled.value,
        [STORAGE_KEYS.MOBILE_MODE]: mobileMode.value,
        [STORAGE_KEYS.DRAG_MODE]: dragMode.value,
        [STORAGE_KEYS.SHOW_USERNAME]: showUsername.value,

        [STORAGE_KEYS.TILE_REFRESH_PAUSED]: tileRefreshPaused.value,
        [STORAGE_KEYS.SMART_CACHE_ENABLED]: smartCacheEnabled.value,
        [STORAGE_KEYS.SMART_DETECTION_ENABLED]: smartDetectionEnabled.value,

        [STORAGE_KEYS.NAVIGATION_METHOD]: navigationMethod.value,

        [STORAGE_KEYS.TEMPLATE_COLOR_SORT]: templateColorSort.value,
        [STORAGE_KEYS.COMPACT_SORT]: compactSort.value,
      });

      console.log('✅ All settings saved to chrome.storage.sync');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
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
      await chromeStorageCompat.sync.set({ [key]: value });
    } catch (error) {
      console.error(`❌ Failed to save setting ${key}:`, error);
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
      showUsername.value = settings.showUsername;

      tileRefreshPaused.value = settings.tileRefreshPaused;
      smartCacheEnabled.value = settings.smartCacheEnabled;
      smartDetectionEnabled.value = settings.smartDetectionEnabled;

      navigationMethod.value = settings.navigationMethod;

      templateColorSort.value = settings.templateColorSort;
      compactSort.value = settings.compactSort;

      // Save all to storage
      await saveAllSettings();

      console.log('✅ Settings applied successfully');
    } catch (error) {
      console.error('❌ Failed to apply settings:', error);
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
      showUsername.value = DEFAULTS.showUsername;

      tileRefreshPaused.value = DEFAULTS.tileRefreshPaused;
      smartCacheEnabled.value = DEFAULTS.smartCacheEnabled;
      smartDetectionEnabled.value = DEFAULTS.smartDetectionEnabled;

      navigationMethod.value = DEFAULTS.navigationMethod;

      templateColorSort.value = DEFAULTS.templateColorSort;
      compactSort.value = DEFAULTS.compactSort;

      await saveAllSettings();

      console.log('✅ Settings reset to defaults');
    } catch (error) {
      console.error('❌ Failed to reset settings:', error);
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
      showUsername: showUsername.value,

      tileRefreshPaused: tileRefreshPaused.value,
      smartCacheEnabled: smartCacheEnabled.value,
      smartDetectionEnabled: smartDetectionEnabled.value,

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
    showUsername,

    tileRefreshPaused,
    smartCacheEnabled,
    smartDetectionEnabled,

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

    updateNavigationMethod,

    updateTemplateColorSort,
    updateCompactSort,

    applySettings,
    resetSettings,
    getCurrentSettings,
  };
});
