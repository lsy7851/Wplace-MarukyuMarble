import { ref, computed, watch } from 'vue';
import { colorPalette, getColorKey } from '@/utils/colorPalette.js';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useColorFilterStore } from '@/stores/colorFilterStore.js';
import { useTileCache } from '@/composables/useTileCache.js';
import { useStatusStore } from '@/stores/statusStore.js';

// ========================================
// SINGLETON STATE - Shared across all component instances
// ========================================
// Current template index being edited
const currentTemplateIndex = ref(0);

// Color filter state
const excludedColors = ref([]);
const disabledColors = ref([]);
const enhancedColors = ref([]);
const searchQuery = ref('');
const sortMode = ref('default');
const viewMode = ref('grid'); // 'grid' or 'list'
const includeWrongPixels = ref(false); // Include wrong pixels in progress calculation

// Initialization flag for singleton
let isInitialized = false;

/**
 * Composable for color filter functionality
 * Uses SINGLETON pattern - all instances share the same state
 * Integrated with template store for real template color management
 */
export function useColorFilter() {
  const templateStore = useTemplateStore();
  const colorFilterStore = useColorFilterStore();
  const tileCache = useTileCache();
  const statusStore = useStatusStore();

  // NOTE: State refs are defined OUTSIDE this function (singleton pattern)
  // This ensures ColorMenu and ColorFilterModal share the same state

  /**
   * Calculate pixel statistics matching legacy calculateRemainingPixelsByColor()
   *
   * Legacy behavior:
   * - totalRequired: from template.colorPalette (ALL pixels, regardless of tile rendering)
   * - painted/wrong: from tileProgress.colorBreakdown (REAL data from rendered tiles)
   * - Disabled colors: INCLUDED in stats (렌더링만 안 됨, 통계엔 포함)
   * - Excluded colors: EXCLUDED from stats (stored in colorFilterStore)
   */
  const pixelStats = computed(() => {
    const stats = {};

    // Get all enabled templates
    const enabledTemplates = templateStore.templates.filter(t => t.enabled);

    // CRITICAL: Access .size to trigger Vue reactivity on Map changes
    const tileProgressSize = templateStore.tileProgress.size;
    if (enabledTemplates.length === 0) {
      return stats;
    }

    // Load excluded colors from store (눈 이모지 = exclude from progress)
    const excludedColorsList = colorFilterStore.excludedColors || [];

    // STEP 1: Get totalRequired from template.colorPalette
    // This gives us ALL pixels regardless of tile rendering
    let totalFromPalette = 0;
    let skippedFromExcluded = 0;

    for (const template of enabledTemplates) {
      const colorPalette = template.colorPalette || {};
      const paletteSize = Object.keys(colorPalette).length;
      const paletteTotal = Object.values(colorPalette).reduce((sum, count) => sum + count, 0);

      // Add Transparent stats
      if (!stats['transparent']) {
        stats['transparent'] = {
          totalRequired: 0,
          painted: 0,
          wrong: 0,
          needsCrosshair: 0
        };
      }

      stats['transparent'].totalRequired += (template.transparentPixelCount || 0);
      stats['transparent'].needsCrosshair += (template.transparentPixelCount || 0);

      for (const [colorKey, pixelCount] of Object.entries(colorPalette)) {
        // Skip excluded colors only (눈 이모지)
        if (excludedColorsList.includes(colorKey)) {
          skippedFromExcluded += pixelCount;
          continue;
        }

        // DO NOT skip disabled colors - they're included in progress stats!
        // (disabled만 렌더링 안 되고 통계엔 포함됨)

        if (!stats[colorKey]) {
          stats[colorKey] = {
            totalRequired: 0,
            painted: 0,
            wrong: 0,
            needsCrosshair: 0
          };
        }

        stats[colorKey].totalRequired += pixelCount;
        totalFromPalette += pixelCount;
      }
    }


    // STEP 2: Get painted/wrong from tileProgress.colorBreakdown
    // This gives us REAL progress data from rendered tiles
    let totalPaintedFromTiles = 0;
    let totalWrongFromTiles = 0;

    for (const [tileKey, tileProgressData] of templateStore.tileProgress.entries()) {
      const colorBreakdown = tileProgressData.colorBreakdown || {};

      for (const [colorKey, colorData] of Object.entries(colorBreakdown)) {
        // Skip excluded colors
        if (excludedColorsList.includes(colorKey)) {
          continue;
        }

        // Only add to colors that exist in stats (from enabled templates)
        if (stats[colorKey]) {
          stats[colorKey].painted += colorData.painted || 0;
          stats[colorKey].wrong += colorData.wrong || 0;
          totalPaintedFromTiles += colorData.painted || 0;
          totalWrongFromTiles += colorData.wrong || 0;
        }
      }
    }


    // STEP 3: Calculate needsCrosshair (remaining pixels)
    for (const colorKey of Object.keys(stats)) {
      stats[colorKey].needsCrosshair = stats[colorKey].totalRequired - stats[colorKey].painted;
    }


    return stats;
  });

  /**
   * Load colors from current template
   */
  function loadTemplateColors(templateIndex = 0) {
    currentTemplateIndex.value = templateIndex;

    const template = templateStore.templates[templateIndex];
    if (!template) return;

    // Load disabled and enhanced colors from template
    disabledColors.value = Array.from(template.disabledColors || []);
    enhancedColors.value = Array.from(template.enhancedColors || []);
  }

  /**
   * Save colors to current template
   * Implements legacy refreshTemplateDisplay() pattern (main.js:8327-8372)
   */
  async function saveTemplateColors() {
    const template = templateStore.templates[currentTemplateIndex.value];
    if (!template) return;

    // Update template colors in store (Single template only, matching legacy limitation)
    await templateStore.updateTemplateColors(
      currentTemplateIndex.value,
      disabledColors.value,
      enhancedColors.value
    );

    // Clear tile cache
    tileCache.clear();

    // Legacy pattern: disable → wait → re-enable (main.js:8342-8352)
    templateStore.templatesShouldBeDrawn = false;
    await new Promise(resolve => setTimeout(resolve, 50));
    templateStore.templatesShouldBeDrawn = true;

    // Force MapLibre to re-fetch tiles by reloading the style
    if (window.mmmap) {
      const style = window.mmmap.getStyle();
      window.mmmap.setStyle(style);
    }
  }

  /**
   * Get color data with statistics
   *
   * IMPORTANT: Legacy skips index 0 (Transparent) in color filter UI
   * Reference: old-src/main.js:9547-9548
   * This is because Transparent ([0,0,0]) and Black ([0,0,0]) share RGB values
   * and only Black should be shown in the UI.
   * 
   * UPDATE: We now display transparent but map its behavior to black (legacy compat)
   */
  const colorData = computed(() => {
    const result = [];

    for (let i = 0; i < colorPalette.length; i++) {

      const colorInfo = colorPalette[i];
      let colorKey = getColorKey(colorInfo.rgb);

      // Special handling for Transparent (Index 0)
      if (i === 0) {
        colorKey = 'transparent';
      }

      const stats = pixelStats.value[colorKey] || {
        totalRequired: 0,
        painted: 0,
        needsCrosshair: 0,
        wrong: 0
      };

      const percentage = stats.totalRequired > 0
        ? Math.round((stats.painted / stats.totalRequired) * 100)
        : 0;

      // For Transparent, enabled state matches Black ('0,0,0')
      const effectiveKeyForStatus = (i === 0) ? '0,0,0' : colorKey;

      result.push({
        colorKey,
        colorInfo,
        stats: {
          ...stats,
          percentage
        },
        isDisabled: disabledColors.value.includes(effectiveKeyForStatus),
        isEnhanced: enhancedColors.value.includes(effectiveKeyForStatus),
        isExcluded: excludedColors.value.includes(effectiveKeyForStatus)
      });
    }

    return result;
  });

  /**
   * Get filtered colors (search + sort)
   */
  const filteredColors = computed(() => {
    let colors = colorData.value;

    // DON'T filter by totalRequired - show ALL colors like old-src
    // colors = colors.filter(c => c.stats.totalRequired > 0);

    // Search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      colors = colors.filter(c =>
        c.colorInfo.name.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortMode.value) {
      case 'premium':
        colors = colors.sort((a, b) => {
          const aFree = a.colorInfo.free ? 0 : 1;
          const bFree = b.colorInfo.free ? 0 : 1;
          if (bFree !== aFree) return bFree - aFree;
          // Secondary sort by most missing
          return b.stats.needsCrosshair - a.stats.needsCrosshair;
        });
        break;

      case 'enhanced':
        colors = colors.filter(c => c.isEnhanced);
        break;

      case 'wrong-desc':
        colors = colors.sort((a, b) => b.stats.wrong - a.stats.wrong);
        break;

      case 'wrong-asc':
        colors = colors.sort((a, b) => a.stats.wrong - b.stats.wrong);
        break;

      case 'missing-desc':
        colors = colors.sort((a, b) => b.stats.needsCrosshair - a.stats.needsCrosshair);
        break;

      case 'missing-asc':
        colors = colors.sort((a, b) => a.stats.needsCrosshair - b.stats.needsCrosshair);
        break;

      case 'total-desc':
        colors = colors.sort((a, b) => b.stats.totalRequired - a.stats.totalRequired);
        break;

      case 'total-asc':
        colors = colors.sort((a, b) => a.stats.totalRequired - b.stats.totalRequired);
        break;

      case 'painted-desc':
        colors = colors.sort((a, b) => b.stats.painted - a.stats.painted);
        break;

      case 'painted-asc':
        colors = colors.sort((a, b) => a.stats.painted - b.stats.painted);
        break;

      case 'percentage-desc':
        colors = colors.sort((a, b) => b.stats.percentage - a.stats.percentage);
        break;

      case 'percentage-asc':
        colors = colors.sort((a, b) => a.stats.percentage - b.stats.percentage);
        break;

      case 'name-asc':
        colors = colors.sort((a, b) =>
          a.colorInfo.name.localeCompare(b.colorInfo.name)
        );
        break;

      case 'name-desc':
        colors = colors.sort((a, b) =>
          b.colorInfo.name.localeCompare(a.colorInfo.name)
        );
        break;

      default: // 'default'
        // Keep original palette order
        break;
    }

    return colors;
  });

  /**
   * Calculate overall progress
   *
   * IMPORTANT: Must iterate pixelStats directly, NOT colorData!
   * colorData is filtered by Wplace palette, but template may have colors not in palette.
   * pixelStats contains ALL colors from templates.
   *
   * Legacy behavior (main.js:4405-4490):
   * - includeWrongPixels = false: displayPainted = painted
   * - includeWrongPixels = true: displayPainted = painted + wrong
   */
  const overallProgress = computed(() => {
    let totalRequired = 0;
    let totalPainted = 0;  // Only correctly painted pixels
    let totalWrong = 0;    // Incorrectly painted pixels
    let totalRemaining = 0;

    // Load excluded colors from store
    const excludedColorsList = colorFilterStore.excludedColors || [];

    // Iterate pixelStats directly (not colorData)
    for (const [colorKey, stats] of Object.entries(pixelStats.value)) {
      // Skip excluded colors
      if (excludedColorsList.includes(colorKey)) {
        continue;
      }

      totalRequired += stats.totalRequired || 0;
      totalPainted += stats.painted || 0;  // Correctly painted only
      totalWrong += stats.wrong || 0;      // Wrong color pixels
    }

    // Calculate effective painted based on includeWrongPixels setting
    const effectivePainted = includeWrongPixels.value
      ? totalPainted + totalWrong  // Include wrong pixels as "painted"
      : totalPainted;              // Only correct pixels

    totalRemaining = totalRequired - effectivePainted;

    return {
      totalRequired,
      totalPainted: effectivePainted,  // Display value (may include wrong)
      totalWrong,
      totalRemaining,
      percentage: totalRequired > 0
        ? Math.round((effectivePainted / totalRequired) * 100)
        : 0
    };
  });

  // Actions

  /**
   * Toggle color enabled/disabled
   */
  async function toggleColorEnabled(colorKey) {
    // Treat 'transparent' as '0,0,0' (Black) due to RGB collision
    const targetKey = colorKey === 'transparent' ? '0,0,0' : colorKey;

    const index = disabledColors.value.indexOf(targetKey);
    const isEnabling = index > -1;

    if (isEnabling) {
      disabledColors.value.splice(index, 1);
    } else {
      disabledColors.value.push(targetKey);
    }

    // Auto-save immediately
    await saveTemplateColors();

    // Find color name
    const colorInfo = colorPalette.find(c => getColorKey(c.rgb) === targetKey || (colorKey === 'transparent' && c.name === 'Transparent'));
    const colorName = colorInfo?.name || targetKey;
    statusStore.handleDisplayStatus(`Color ${isEnabling ? 'enabled' : 'disabled'}: ${colorName}`);
  }

  /**
   * Toggle color enhanced mode
   */
  async function toggleColorEnhanced(colorKey) {
    // Treat 'transparent' as '0,0,0' (Black) due to RGB collision
    const targetKey = colorKey === 'transparent' ? '0,0,0' : colorKey;

    const index = enhancedColors.value.indexOf(targetKey);
    const isEnabling = index === -1;

    if (index > -1) {
      enhancedColors.value.splice(index, 1);
    } else {
      enhancedColors.value.push(targetKey);
    }

    // Auto-save immediately
    await saveTemplateColors();

    // Find color name
    const colorInfo = colorPalette.find(c => getColorKey(c.rgb) === targetKey || (colorKey === 'transparent' && c.name === 'Transparent'));
    const colorName = colorInfo?.name || targetKey;
    statusStore.handleDisplayStatus(`✅ Enhanced mode ${isEnabling ? 'enabled' : 'disabled'} for: ${colorName}`);
  }

  /**
   * Toggle color excluded from progress
   */
  function toggleColorExcluded(colorKey) {
    const index = excludedColors.value.indexOf(colorKey);
    const wasExcluded = index > -1;

    if (wasExcluded) {
      excludedColors.value.splice(index, 1);
    } else {
      excludedColors.value.push(colorKey);
    }

    statusStore.handleDisplayStatus(`Color ${wasExcluded ? 'included in' : 'excluded from'} progress calculation`);
  }

  /**
   * Enable all colors
   */
  async function enableAllColors() {
    disabledColors.value = [];
    await saveTemplateColors();
    statusStore.handleDisplayStatus('Enabling all colors...');
  }

  /**
   * Disable all colors
   */
  async function disableAllColors() {
    disabledColors.value = filteredColors.value.map(c => c.colorKey);
    await saveTemplateColors();
    statusStore.handleDisplayStatus('Disabling all colors...');
  }

  /**
   * Disable all enhanced colors
   */
  async function disableAllEnhanced() {
    enhancedColors.value = [];
    await saveTemplateColors();
  }

  /**
   * Load settings from store
   */
  function loadSettings() {
    try {
      // Load from store (already initialized by colorFilterStore)
      excludedColors.value = [...colorFilterStore.excludedColors];
      viewMode.value = colorFilterStore.viewMode;
      sortMode.value = colorFilterStore.sortMode;
    } catch {
      // Ignore load errors
    }
  }

  /**
   * Save settings to store
   */
  async function saveSettings() {
    try {
      await colorFilterStore.updateExcludedColors([...excludedColors.value]);
      await colorFilterStore.updateViewMode(viewMode.value);
      await colorFilterStore.updateSortMode(sortMode.value);
    } catch {
      // Ignore save errors
    }
  }

  // Initialize only once (singleton pattern)
  if (!isInitialized) {
    loadSettings();

    // Auto-load colors from first template when templates are loaded
    // This ensures color filter settings persist across page refreshes
    watch(
      () => templateStore.templates.length,
      (newLength) => {
        if (newLength > 0 && !isInitialized) {
          loadTemplateColors(0);
          isInitialized = true;
        }
      },
      { immediate: true }
    );
  }

  return {
    // State
    currentTemplateIndex,
    excludedColors,
    disabledColors,
    enhancedColors,
    searchQuery,
    sortMode,
    viewMode,
    includeWrongPixels,

    // Computed
    colorData,
    filteredColors,
    overallProgress,

    // Methods
    loadTemplateColors,
    saveTemplateColors,
    toggleColorEnabled,
    toggleColorEnhanced,
    toggleColorExcluded,
    enableAllColors,
    disableAllColors,
    disableAllEnhanced,
    loadSettings,
    saveSettings
  };
}
