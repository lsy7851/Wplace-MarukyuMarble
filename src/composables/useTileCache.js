/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Original work Copyright (c) SwingTheVine
 * Derived from works by Hao-1337 and pixelkat5
 * Modified work Copyright (c) Seris0
 * Modified work Copyright (c) 2025 lsy7851 and Marukyu Marble Contributors
 */
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useStatusStore } from '@/stores/statusStore';

/**
 * Tile Cache Composable
 *
 * LRU cache system for rendered tiles to improve performance
 * - Max 500 tiles cached
 * - Automatic LRU eviction when cache is full
 * - Cache hit/miss statistics
 * - Tile refresh pause/resume functionality
 * - Force refresh single tile capability
 *
 * Reference: old-src/tileManager.js:1-457
 */

// Global cache storage (Singleton pattern)
const cache = new Map(); // key → blob (direct storage, matching legacy)
const accessOrder = new Map(); // key → lastAccessTime (for LRU)
const frozenCache = new Map(); // key → blob (for pause functionality)

// Global Statistics
const hits = ref(0);
const misses = ref(0);
const maxSize = ref(500);
const frozenCacheMaxSize = 100; // Separate limit for frozen cache (matching legacy)
const enabled = ref(true);
const paused = ref(false);
const isInitialized = ref(false);

// Original renderer reference for force refresh
let originalRenderer = null;
let isCapturingState = false; // Flag to avoid recursion during capture

// Canvas state tracking
let lastCanvasChangeTime = 0;

// Cache version for invalidation
const CACHE_VERSION = '1.0';

export function useTileCache() {
  const settingsStore = useSettingsStore();
  const templateStore = useTemplateStore();

  /**
   * Computed statistics
   * Matches legacy getSmartCacheStats() format
   * Reference: old-src/tileManager.js:206-216
   */
  const stats = computed(() => {
    const total = hits.value + misses.value;
    const hitRate = total > 0 ? (hits.value / total) * 100 : 0;

    return {
      enabled: enabled.value,
      size: cache.size,
      maxSize: maxSize.value,
      hits: hits.value,
      misses: misses.value,
      hitRate: hitRate.toFixed(1) + '%'
    };
  });

  /**
   * Initialize cache from store
   */
  function initialize() {
    if (isInitialized.value) return;

    try {
      // Check version and clear if outdated
      const storedVersion = settingsStore.tileCacheVersion;
      if (storedVersion !== CACHE_VERSION) {
        clearSmartCache();
        settingsStore.updateTileCacheVersion(CACHE_VERSION);
      }

      // Load enabled/paused state from store
      enabled.value = settingsStore.smartCacheEnabled ?? true;
      paused.value = settingsStore.tileRefreshPaused ?? false;

      // Load statistics from store
      const statsData = settingsStore.tileCacheStats || { hits: 0, misses: 0 };
      hits.value = statsData.hits || 0;
      misses.value = statsData.misses || 0;

      isInitialized.value = true;
    } catch (error) {
      clearSmartCache();
    }
  }

  /**
   * Set original renderer function for force refresh capability
   * @param {Function} renderer - The original drawTemplateOnTile function
   */
  function setOriginalRenderer(renderer) {
    originalRenderer = renderer;
  }

  /**
   * Generate cache key for a tile
   * Format matches legacy: ${coordsKey}_${templateHash}_${contentHash}
   * Reference: old-src/tileManager.js:81-106
   *
   * @param {[number, number]|string} tileCoords - Tile coordinates [tileX, tileY] or string "XXXX,YYYY"
   * @param {Blob} tileBlob - Original tile blob (for content hash)
   * @returns {string} Cache key
   */
  function generateCacheKey(tileCoords, tileBlob = null) {
    // Tile coordinates - handle both array and string inputs (legacy compatibility)
    // Reference: old-src/tileManager.js:82-85
    const coordsKey = Array.isArray(tileCoords)
      ? `${String(tileCoords[0]).padStart(4, '0')},${String(tileCoords[1]).padStart(4, '0')}`
      : String(tileCoords);

    // Template state hash (enabled templates + their settings)
    // Null check for templates array (legacy compatibility)
    // Reference: old-src/tileManager.js:87-95
    let templateHash = '';
    const templates = templateStore.templates;
    if (templates && templates.length > 0) {
      templateHash = templates
        .filter(t => t.enabled !== false)  // Legacy: enabled !== false (undefined = enabled)
        .map(t => `${t.name || 'unnamed'}_${t.sortID || 0}`)  // Legacy format: name_sortID
        .sort()
        .join('|');
    }

    // Content hash (blob size and type)
    // Reference: old-src/tileManager.js:97-103
    let contentHash = 'nodata';
    if (tileBlob && tileBlob.size) {
      contentHash = `${tileBlob.size}_${tileBlob.type}`;
    }

    // Legacy format: coordsKey_templateHash_contentHash (no settingsHash)
    // Settings changes are handled by invalidateForSettingsChange() clearing the cache
    return `${coordsKey}_${templateHash}_${contentHash}`;
  }

  /**
   * Update access time for LRU tracking
   * @param {string} key - Cache key
   */
  function updateAccess(key) {
    accessOrder.set(key, Date.now());
  }

  /**
   * Evict least recently used entries when cache is full
   */
  function evictLRU() {
    if (cache.size <= maxSize.value) return;

    // Sort by access time and remove oldest entries
    const sortedEntries = Array.from(accessOrder.entries())
      .sort(([, a], [, b]) => a - b);

    // Remove oldest entries to get back under max size (plus a bit of headroom)
    const entriesToRemove = sortedEntries.slice(0, cache.size - maxSize.value + 10);

    for (const [key] of entriesToRemove) {
      cache.delete(key);
      accessOrder.delete(key);
    }

  }

  /**
   * Generate tile key for frozen cache (simpler than full cache key)
   * @param {[number, number]|string} tileCoords - Tile coordinates
   * @returns {string} Tile key "XXXX,YYYY"
   */
  function getTileKey(tileCoords) {
    // Handle both array and string inputs (legacy compatibility)
    return Array.isArray(tileCoords)
      ? `${String(tileCoords[0]).padStart(4, '0')},${String(tileCoords[1]).padStart(4, '0')}`
      : String(tileCoords);
  }

  /**
   * Get tile from cache
   * @param {[number, number]|string} tileCoords - Tile coordinates
   * @param {Blob} tileBlob - Original tile blob
   * @returns {Blob|null} Cached tile or null if not found
   */
  function get(tileCoords, tileBlob = null) {
    if (!enabled.value) return null;

    // If paused, return frozen cache
    if (paused.value) {
      const tileKey = getTileKey(tileCoords);
      if (frozenCache.has(tileKey)) {
        return frozenCache.get(tileKey);
      }
      return null;
    }

    const key = generateCacheKey(tileCoords, tileBlob);

    if (cache.has(key)) {
      updateAccess(key);
      hits.value++;
      return cache.get(key);
    }

    misses.value++;
    return null;
  }

  /**
   * Store tile in cache
   * @param {[number, number]} tileCoords - Tile coordinates
   * @param {Blob} tileBlob - Original tile blob
   * @param {Blob} processedBlob - Processed tile blob (with templates)
   */
  function set(tileCoords, tileBlob, processedBlob) {
    if (!enabled.value) return;

    try {
      const key = generateCacheKey(tileCoords, tileBlob);

      // Store in main cache (direct blob storage, matching legacy)
      cache.set(key, processedBlob);

      updateAccess(key);
      evictLRU();

      // Also store in frozen cache for pause functionality
      // Only if not paused and not currently capturing state (avoid recursion)
      if (!paused.value && !isCapturingState) {
        const tileKey = getTileKey(tileCoords);
        frozenCache.set(tileKey, processedBlob);

        // Limit frozen cache size to prevent memory issues (matching legacy: 100 tiles)
        if (frozenCache.size > frozenCacheMaxSize) {
          const firstKey = frozenCache.keys().next().value;
          frozenCache.delete(firstKey);
        }
      }

      // Save statistics periodically
      if ((hits.value + misses.value) % 50 === 0) {
        saveStats();
      }
    } catch {
      // Ignore cache storage failures
    }
  }

  /**
   * Set capturing state flag (prevents frozen cache updates during state capture)
   * @param {boolean} capturing - Whether currently capturing state
   */
  function setCapturingState(capturing) {
    isCapturingState = capturing;
  }

  /**
   * Clear smart tile cache only (preserves frozen cache)
   */
  function clearSmartCache() {
    cache.clear();
    accessOrder.clear();
    hits.value = 0;
    misses.value = 0;
    saveStats();
  }

  /**
   * Clear frozen tile cache only (preserves smart cache)
   * @returns {number} Number of tiles that were cleared
   */
  function clearFrozenCache() {
    const previousSize = frozenCache.size;
    frozenCache.clear();
    return previousSize;
  }

  /**
   * Clear entire cache (both smart and frozen)
   */
  function clear() {
    cache.clear();
    accessOrder.clear();
    frozenCache.clear();
    hits.value = 0;
    misses.value = 0;
    saveStats();
  }

  /**
   * Invalidate cache when visual settings change
   * This ensures tiles are reprocessed when Map View or Enhanced modes change
   */
  function invalidateForSettingsChange() {
    if (enabled.value && cache.size > 0) {
      clearSmartCache();
    }
  }

  /**
   * Toggle cache enabled/disabled
   * @returns {boolean} New enabled state
   */
  function toggle() {
    enabled.value = !enabled.value;

    // Persist to settings store
    settingsStore.updateSmartCacheEnabled(enabled.value);

    if (!enabled.value) {
      clearSmartCache();
    }

    return enabled.value;
  }

  /**
   * Toggle tile refresh pause
   * @returns {boolean} New paused state
   */
  function togglePause() {
    paused.value = !paused.value;
    settingsStore.updateTileRefreshPaused(paused.value);

    // Status message for pause toggle
    const statusStore = useStatusStore();
    if (paused.value) {
      statusStore.handleDisplayStatus(`🧊 Tile refresh paused! Showing frozen template view with ${frozenCache.size} cached tiles.`);
    } else {
      statusStore.handleDisplayStatus(`▶️ Tile refresh resumed - templates now update in real-time`);
    }

    return paused.value;
  }

  /**
   * Force refresh a single tile even when paused (for testing/debugging)
   * @param {Blob} tileBlob - The tile blob data
   * @param {[number, number]} tileCoords - The tile coordinates
   * @returns {Promise<Blob>} The processed tile blob
   */
  async function forceRefreshSingleTile(tileBlob, tileCoords) {
    if (originalRenderer) {
      return await originalRenderer(tileBlob, tileCoords);
    }
    return tileBlob;
  }

  /**
   * Get performance statistics for tile processing
   * Matches legacy format: {paused, cachedTiles, message}
   * Reference: old-src/tileManager.js:433-441
   * @returns {Object} Performance stats including paused state and cached tiles count
   */
  function getTilePerformanceStats() {
    return {
      paused: paused.value,
      cachedTiles: frozenCache.size,
      message: paused.value
        ? `Tile processing is paused. ${frozenCache.size} tiles cached.`
        : 'Tile processing is active'
    };
  }

  /**
   * Get the number of tiles currently in the frozen cache
   * @returns {number} Number of frozen cached tiles
   */
  function getCachedTileCount() {
    return frozenCache.size;
  }

  /**
   * Save statistics to store
   */
  function saveStats() {
    try {
      const statsData = {
        hits: hits.value,
        misses: misses.value
      };
      settingsStore.updateTileCacheStats(statsData);
    } catch {
      // Ignore save failures
    }
  }

  /**
   * Notify cache that canvas has changed (pixels painted/modified)
   * Note: Cache no longer blocks real-time updates, so this is mainly for statistics
   */
  function notifyCanvasChange() {
    lastCanvasChangeTime = Date.now();
  }

  // Initialize on creation
  initialize();

  return {
    // Cache operations
    get,
    set,
    clear,
    clearSmartCache,
    clearFrozenCache,
    invalidateForSettingsChange,

    // Cache management
    toggle,
    togglePause,
    notifyCanvasChange,
    setOriginalRenderer,
    setCapturingState,

    // Force refresh (when paused)
    forceRefreshSingleTile,

    // Statistics & Performance
    stats,
    hits,
    misses,
    enabled,
    paused,
    getTilePerformanceStats,
    getCachedTileCount,

    // Internal (for testing)
    generateCacheKey
  };
}
