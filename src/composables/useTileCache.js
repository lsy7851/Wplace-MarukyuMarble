import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTemplateStore } from '@/stores/templateStore';

/**
 * Tile Cache Composable
 *
 * LRU cache system for rendered tiles to improve performance
 * - Max 500 tiles cached
 * - Automatic LRU eviction when cache is full
 * - Cache hit/miss statistics
 * - Tile refresh pause/resume functionality
 *
 * Reference: old-src/tileManager.js:1-457
 */
export function useTileCache() {
  const settingsStore = useSettingsStore();
  const templateStore = useTemplateStore();

  // Cache storage
  const cache = new Map(); // key → {blob, timestamp}
  const accessOrder = new Map(); // key → lastAccessTime (for LRU)
  const frozenCache = new Map(); // key → blob (for pause functionality)

  // Statistics
  const hits = ref(0);
  const misses = ref(0);
  const maxSize = ref(500);
  const enabled = ref(true);
  const paused = ref(false);

  // Cache version for invalidation
  const CACHE_VERSION = '1.0';
  const CACHE_VERSION_KEY = 'mmTileCacheVersion';
  const CACHE_STATS_KEY = 'mmTileCacheStats';

  /**
   * Computed statistics
   */
  const stats = computed(() => {
    const total = hits.value + misses.value;
    const hitRate = total > 0 ? (hits.value / total) * 100 : 0;

    return {
      enabled: enabled.value,
      paused: paused.value,
      size: cache.size,
      maxSize: maxSize.value,
      hits: hits.value,
      misses: misses.value,
      hitRate: hitRate.toFixed(1) + '%'
    };
  });

  /**
   * Initialize cache from localStorage
   */
  function initialize() {
    try {
      // Check version and clear if outdated
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (storedVersion !== CACHE_VERSION) {
        console.log('[Tile Cache] Version mismatch, clearing cache');
        clear();
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      }

      // Load statistics
      const statsData = JSON.parse(localStorage.getItem(CACHE_STATS_KEY) || '{"hits":0,"misses":0}');
      hits.value = statsData.hits || 0;
      misses.value = statsData.misses || 0;

      console.log(`[Tile Cache] Initialized - Enabled: ${enabled.value}, Size: ${cache.size}`);
    } catch (error) {
      console.warn('Failed to initialize tile cache:', error);
      clear();
    }
  }

  /**
   * Generate cache key for a tile
   * @param {[number, number]} tileCoords - Tile coordinates [tileX, tileY]
   * @param {Blob} tileBlob - Original tile blob (for content hash)
   * @returns {string} Cache key
   */
  function generateCacheKey(tileCoords, tileBlob = null) {
    // Tile coordinates
    const [tileX, tileY] = tileCoords;
    const coordsKey = `${String(tileX).padStart(4, '0')},${String(tileY).padStart(4, '0')}`;

    // Template state hash (enabled templates + their settings)
    const templateHash = templateStore.templates
      .filter(t => t.enabled)
      .map(t => {
        // Include color filter state in hash
        const disabledColors = Array.from(t.disabledColors).sort().join(',');
        const enhancedColors = Array.from(t.enhancedColors).sort().join(',');
        return `${t.id}_${t.sortID}_${disabledColors}_${enhancedColors}`;
      })
      .sort()
      .join('|');

    // Content hash (blob size and type)
    let contentHash = 'nodata';
    if (tileBlob && tileBlob.size) {
      contentHash = `${tileBlob.size}_${tileBlob.type}`;
    }

    // Settings hash (visual settings that affect rendering)
    const settingsHash = [
      settingsStore.settings.errorMapEnabled,
      settingsStore.settings.showCorrectPixels,
      settingsStore.settings.showWrongPixels,
      settingsStore.settings.showUnpaintedAsWrong,
      settingsStore.settings.enhanceWrongColors,
      settingsStore.settings.crosshairColor?.r,
      settingsStore.settings.crosshairColor?.g,
      settingsStore.settings.crosshairColor?.b,
      settingsStore.settings.crosshairBorder
    ].join('_');

    return `${coordsKey}_${templateHash}_${contentHash}_${settingsHash}`;
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

    console.log(`[Tile Cache] Evicted ${entriesToRemove.length} LRU entries, size now: ${cache.size}`);
  }

  /**
   * Get tile from cache
   * @param {[number, number]} tileCoords - Tile coordinates
   * @param {Blob} tileBlob - Original tile blob
   * @returns {Blob|null} Cached tile or null if not found
   */
  function get(tileCoords, tileBlob = null) {
    if (!enabled.value) return null;

    // If paused, return frozen cache
    if (paused.value) {
      const tileKey = `${String(tileCoords[0]).padStart(4, '0')},${String(tileCoords[1]).padStart(4, '0')}`;
      if (frozenCache.has(tileKey)) {
        console.log(`[Tile Cache] Frozen cache hit for tile: ${tileKey}`);
        return frozenCache.get(tileKey);
      }
      return null;
    }

    const key = generateCacheKey(tileCoords, tileBlob);

    if (cache.has(key)) {
      updateAccess(key);
      hits.value++;
      console.log(`[Tile Cache] HIT for key: ${key.substring(0, 40)}...`);
      return cache.get(key).blob;
    }

    misses.value++;
    console.log(`[Tile Cache] MISS for key: ${key.substring(0, 40)}...`);
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

      // Store in main cache
      cache.set(key, {
        blob: processedBlob,
        timestamp: Date.now()
      });

      updateAccess(key);
      evictLRU();

      // Also store in frozen cache for pause functionality
      if (!paused.value) {
        const tileKey = `${String(tileCoords[0]).padStart(4, '0')},${String(tileCoords[1]).padStart(4, '0')}`;
        frozenCache.set(tileKey, processedBlob);

        // Limit frozen cache size to prevent memory issues
        if (frozenCache.size > 100) {
          const firstKey = frozenCache.keys().next().value;
          frozenCache.delete(firstKey);
        }
      }

      // Save statistics periodically
      if ((hits.value + misses.value) % 50 === 0) {
        saveStats();
      }
    } catch (error) {
      console.warn('Failed to store tile in cache:', error);
    }
  }

  /**
   * Clear entire cache
   */
  function clear() {
    cache.clear();
    accessOrder.clear();
    frozenCache.clear();
    hits.value = 0;
    misses.value = 0;
    saveStats();
    console.log('[Tile Cache] Cache cleared');
  }

  /**
   * Invalidate cache (e.g., when settings change)
   */
  function invalidate() {
    if (cache.size > 0) {
      console.log('[Tile Cache] Invalidating cache due to settings change');
      clear();
    }
  }

  /**
   * Toggle cache enabled/disabled
   * @returns {boolean} New enabled state
   */
  function toggle() {
    enabled.value = !enabled.value;

    if (!enabled.value) {
      clear();
    }

    console.log(`[Tile Cache] Toggled ${enabled.value ? 'ON' : 'OFF'}`);
    return enabled.value;
  }

  /**
   * Toggle tile refresh pause
   * @returns {boolean} New paused state
   */
  function togglePause() {
    paused.value = !paused.value;

    if (!paused.value) {
      // Resume: clear frozen cache to allow fresh renders
      frozenCache.clear();
      console.log('[Tile Cache] Resumed tile refresh');
    } else {
      console.log('[Tile Cache] Paused tile refresh (frozen state captured)');
    }

    return paused.value;
  }

  /**
   * Save statistics to localStorage
   */
  function saveStats() {
    try {
      const statsData = {
        hits: hits.value,
        misses: misses.value
      };
      localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(statsData));
    } catch (error) {
      console.warn('Failed to save cache statistics:', error);
    }
  }

  /**
   * Notify cache that canvas has changed (pixels painted)
   * This is mainly for statistics tracking
   */
  function notifyCanvasChange() {
    console.log('[Tile Cache] Canvas change detected');
    // Cache is not invalidated automatically - relies on content hash
  }

  /**
   * Get cache size in bytes (approximate)
   * @returns {number} Approximate cache size in bytes
   */
  function getSizeInBytes() {
    let totalSize = 0;
    for (const [, entry] of cache) {
      if (entry.blob && entry.blob.size) {
        totalSize += entry.blob.size;
      }
    }
    return totalSize;
  }

  /**
   * Get cache size in human-readable format
   * @returns {string} Cache size (e.g., "12.5 MB")
   */
  const sizeFormatted = computed(() => {
    const bytes = getSizeInBytes();
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  });

  // Initialize on creation
  initialize();

  return {
    // Cache operations
    get,
    set,
    clear,
    invalidate,

    // Cache management
    toggle,
    togglePause,
    notifyCanvasChange,

    // Statistics
    stats,
    sizeFormatted,
    hits,
    misses,
    enabled,
    paused,

    // Internal (for testing)
    generateCacheKey,
    getSizeInBytes
  };
}
