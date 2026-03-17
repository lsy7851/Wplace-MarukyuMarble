/**
 * Performance Settings Sub-module
 *
 * Manages tile refresh, smart cache, smart detection, and cache stats.
 */

import { ref } from 'vue';
import { STORAGE_KEYS, DEFAULTS } from './storageKeys.js';

export function createPerformanceSettings(saveSetting) {
  const tileRefreshPaused = ref(DEFAULTS.tileRefreshPaused);
  const smartCacheEnabled = ref(DEFAULTS.smartCacheEnabled);
  const smartDetectionEnabled = ref(DEFAULTS.smartDetectionEnabled);
  const tileCacheVersion = ref(DEFAULTS.tileCacheVersion);
  const tileCacheStats = ref({ ...DEFAULTS.tileCacheStats });

  function loadFromStorage(result) {
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
  }

  function getStorageData() {
    return {
      [STORAGE_KEYS.TILE_REFRESH_PAUSED]: tileRefreshPaused.value,
      [STORAGE_KEYS.SMART_CACHE_ENABLED]: smartCacheEnabled.value,
      [STORAGE_KEYS.SMART_DETECTION_ENABLED]: smartDetectionEnabled.value,
      [STORAGE_KEYS.TILE_CACHE_VERSION]: tileCacheVersion.value,
      [STORAGE_KEYS.TILE_CACHE_STATS]: JSON.parse(JSON.stringify(tileCacheStats.value)),
    };
  }

  function applySettings(settings) {
    tileRefreshPaused.value = settings.tileRefreshPaused;
    smartCacheEnabled.value = settings.smartCacheEnabled;
    smartDetectionEnabled.value = settings.smartDetectionEnabled;
  }

  function resetToDefaults() {
    tileRefreshPaused.value = DEFAULTS.tileRefreshPaused;
    smartCacheEnabled.value = DEFAULTS.smartCacheEnabled;
    smartDetectionEnabled.value = DEFAULTS.smartDetectionEnabled;
  }

  function getCurrentSettings() {
    return {
      tileRefreshPaused: tileRefreshPaused.value,
      smartCacheEnabled: smartCacheEnabled.value,
      smartDetectionEnabled: smartDetectionEnabled.value,
    };
  }

  async function updateTileRefreshPaused(paused) {
    tileRefreshPaused.value = paused;
    await saveSetting(STORAGE_KEYS.TILE_REFRESH_PAUSED, paused);
  }

  async function updateSmartCacheEnabled(enabled) {
    smartCacheEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.SMART_CACHE_ENABLED, enabled);
  }

  async function updateSmartDetectionEnabled(enabled) {
    smartDetectionEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.SMART_DETECTION_ENABLED, enabled);
  }

  async function updateTileCacheVersion(version) {
    tileCacheVersion.value = version;
    await saveSetting(STORAGE_KEYS.TILE_CACHE_VERSION, version);
  }

  async function updateTileCacheStats(stats) {
    tileCacheStats.value = stats;
    await saveSetting(STORAGE_KEYS.TILE_CACHE_STATS, stats);
  }

  return {
    // State
    tileRefreshPaused,
    smartCacheEnabled,
    smartDetectionEnabled,
    tileCacheVersion,
    tileCacheStats,

    // Internal
    loadFromStorage,
    getStorageData,
    applySettings,
    resetToDefaults,
    getCurrentSettings,

    // Actions
    updateTileRefreshPaused,
    updateSmartCacheEnabled,
    updateSmartDetectionEnabled,
    updateTileCacheVersion,
    updateTileCacheStats,
  };
}
