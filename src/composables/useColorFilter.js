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
import { ref, computed, watch } from 'vue';
import { createSharedComposable } from '@vueuse/core';
import { colorPalette, getColorKey } from '@/utils/colorPalette.js';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useColorFilterStore } from '@/stores/colorFilterStore.js';
import { useTileCache } from '@/composables/useTileCache.js';
import { useStatusStore } from '@/stores/statusStore.js';

/**
 * Composable for color filter functionality
 *
 * Uses createSharedComposable from VueUse to ensure all component instances
 * share the same reactive state (singleton pattern with lifecycle safety).
 * Integrated with template store for real template color management.
 */
function _useColorFilter() {
  const templateStore = useTemplateStore();
  const colorFilterStore = useColorFilterStore();
  const tileCache = useTileCache();
  const statusStore = useStatusStore();

  // State (shared across all consumers via createSharedComposable)
  const currentTemplateIndex = ref(0);
  const excludedColors = ref([]);
  const disabledColors = ref([]);
  const enhancedColors = ref([]);
  const searchQuery = ref('');
  const sortMode = ref('default');
  const viewMode = ref('grid');
  const includeWrongPixels = ref(false);

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

    const enabledTemplates = templateStore.templates.filter((t) => t.enabled);

    // CRITICAL: Access .size to trigger Vue reactivity on Map changes
    const tileProgressSize = templateStore.tileProgress.size;
    if (enabledTemplates.length === 0) {
      return stats;
    }

    const excludedColorsList = colorFilterStore.excludedColors || [];

    let totalFromPalette = 0;
    let skippedFromExcluded = 0;

    for (const template of enabledTemplates) {
      const templatePalette = template.colorPalette || {};

      if (!stats['transparent']) {
        stats['transparent'] = {
          totalRequired: 0,
          painted: 0,
          wrong: 0,
          needsCrosshair: 0,
        };
      }

      stats['transparent'].totalRequired += template.transparentPixelCount || 0;
      stats['transparent'].needsCrosshair += template.transparentPixelCount || 0;

      for (const [colorKey, pixelCount] of Object.entries(templatePalette)) {
        if (excludedColorsList.includes(colorKey)) {
          skippedFromExcluded += pixelCount;
          continue;
        }

        if (!stats[colorKey]) {
          stats[colorKey] = {
            totalRequired: 0,
            painted: 0,
            wrong: 0,
            needsCrosshair: 0,
          };
        }

        stats[colorKey].totalRequired += pixelCount;
        totalFromPalette += pixelCount;
      }
    }

    for (const [tileKey, tileProgressData] of templateStore.tileProgress.entries()) {
      const colorBreakdown = tileProgressData.colorBreakdown || {};

      for (const [colorKey, colorData] of Object.entries(colorBreakdown)) {
        if (excludedColorsList.includes(colorKey)) {
          continue;
        }

        if (stats[colorKey]) {
          stats[colorKey].painted += colorData.painted || 0;
          stats[colorKey].wrong += colorData.wrong || 0;
        }
      }
    }

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

    await templateStore.updateTemplateColors(
      currentTemplateIndex.value,
      disabledColors.value,
      enhancedColors.value
    );

    tileCache.clear();

    // Legacy pattern: disable -> wait -> re-enable (main.js:8342-8352)
    templateStore.templatesShouldBeDrawn = false;
    await new Promise((resolve) => setTimeout(resolve, 50));
    templateStore.templatesShouldBeDrawn = true;

    if (window.mmmap) {
      const style = window.mmmap.getStyle();
      window.mmmap.setStyle(style);
    }
  }

  /**
   * Get color data with statistics
   *
   * IMPORTANT: Legacy skips index 0 (Transparent) in color filter UI
   * UPDATE: We now display transparent but map its behavior to black (legacy compat)
   */
  const colorData = computed(() => {
    const result = [];

    for (let i = 0; i < colorPalette.length; i++) {
      const colorInfo = colorPalette[i];
      let colorKey = getColorKey(colorInfo.rgb);

      if (i === 0) {
        colorKey = 'transparent';
      }

      const stats = pixelStats.value[colorKey] || {
        totalRequired: 0,
        painted: 0,
        needsCrosshair: 0,
        wrong: 0,
      };

      const percentage =
        stats.totalRequired > 0 ? Math.round((stats.painted / stats.totalRequired) * 100) : 0;

      const effectiveKeyForStatus = i === 0 ? '0,0,0' : colorKey;

      result.push({
        colorKey,
        colorInfo,
        stats: {
          ...stats,
          percentage,
        },
        isDisabled: disabledColors.value.includes(effectiveKeyForStatus),
        isEnhanced: enhancedColors.value.includes(effectiveKeyForStatus),
        isExcluded: excludedColors.value.includes(effectiveKeyForStatus),
      });
    }

    return result;
  });

  /**
   * Get filtered colors (search + sort)
   */
  const filteredColors = computed(() => {
    let colors = colorData.value;

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      colors = colors.filter((c) => c.colorInfo.name.toLowerCase().includes(query));
    }

    switch (sortMode.value) {
      case 'premium':
        colors = colors.sort((a, b) => {
          const aFree = a.colorInfo.free ? 0 : 1;
          const bFree = b.colorInfo.free ? 0 : 1;
          if (bFree !== aFree) return bFree - aFree;
          return b.stats.needsCrosshair - a.stats.needsCrosshair;
        });
        break;

      case 'enhanced':
        colors = colors.filter((c) => c.isEnhanced);
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
        colors = colors.sort((a, b) => a.colorInfo.name.localeCompare(b.colorInfo.name));
        break;

      case 'name-desc':
        colors = colors.sort((a, b) => b.colorInfo.name.localeCompare(a.colorInfo.name));
        break;

      default:
        break;
    }

    return colors;
  });

  /**
   * Calculate overall progress
   *
   * IMPORTANT: Must iterate pixelStats directly, NOT colorData!
   * pixelStats contains ALL colors from templates.
   */
  const overallProgress = computed(() => {
    let totalRequired = 0;
    let totalPainted = 0;
    let totalWrong = 0;
    let totalRemaining = 0;

    const excludedColorsList = colorFilterStore.excludedColors || [];

    for (const [colorKey, stats] of Object.entries(pixelStats.value)) {
      if (excludedColorsList.includes(colorKey)) {
        continue;
      }

      totalRequired += stats.totalRequired || 0;
      totalPainted += stats.painted || 0;
      totalWrong += stats.wrong || 0;
    }

    const effectivePainted = includeWrongPixels.value ? totalPainted + totalWrong : totalPainted;

    totalRemaining = totalRequired - effectivePainted;

    return {
      totalRequired,
      totalPainted: effectivePainted,
      totalWrong,
      totalRemaining,
      percentage: totalRequired > 0 ? Math.round((effectivePainted / totalRequired) * 100) : 0,
    };
  });

  // Actions

  async function toggleColorEnabled(colorKey) {
    const targetKey = colorKey === 'transparent' ? '0,0,0' : colorKey;

    const index = disabledColors.value.indexOf(targetKey);
    const isEnabling = index > -1;

    if (isEnabling) {
      disabledColors.value.splice(index, 1);
    } else {
      disabledColors.value.push(targetKey);
    }

    await saveTemplateColors();

    const colorInfo = colorPalette.find(
      (c) =>
        getColorKey(c.rgb) === targetKey ||
        (colorKey === 'transparent' && c.name === 'Transparent')
    );
    const colorName = colorInfo?.name || targetKey;
    statusStore.handleDisplayStatus(`Color ${isEnabling ? 'enabled' : 'disabled'}: ${colorName}`);
  }

  async function toggleColorEnhanced(colorKey) {
    const targetKey = colorKey === 'transparent' ? '0,0,0' : colorKey;

    const index = enhancedColors.value.indexOf(targetKey);
    const isEnabling = index === -1;

    if (index > -1) {
      enhancedColors.value.splice(index, 1);
    } else {
      enhancedColors.value.push(targetKey);
    }

    await saveTemplateColors();

    const colorInfo = colorPalette.find(
      (c) =>
        getColorKey(c.rgb) === targetKey ||
        (colorKey === 'transparent' && c.name === 'Transparent')
    );
    const colorName = colorInfo?.name || targetKey;
    statusStore.handleDisplayStatus(
      `✅ Enhanced mode ${isEnabling ? 'enabled' : 'disabled'} for: ${colorName}`
    );
  }

  function toggleColorExcluded(colorKey) {
    const index = excludedColors.value.indexOf(colorKey);
    const wasExcluded = index > -1;

    if (wasExcluded) {
      excludedColors.value.splice(index, 1);
    } else {
      excludedColors.value.push(colorKey);
    }

    statusStore.handleDisplayStatus(
      `Color ${wasExcluded ? 'included in' : 'excluded from'} progress calculation`
    );
  }

  async function enableAllColors() {
    disabledColors.value = [];
    await saveTemplateColors();
    statusStore.handleDisplayStatus('Enabling all colors...');
  }

  async function disableAllColors() {
    disabledColors.value = filteredColors.value.map((c) => c.colorKey);
    await saveTemplateColors();
    statusStore.handleDisplayStatus('Disabling all colors...');
  }

  async function disableAllEnhanced() {
    enhancedColors.value = [];
    await saveTemplateColors();
  }

  function loadSettings() {
    try {
      excludedColors.value = [...colorFilterStore.excludedColors];
      viewMode.value = colorFilterStore.viewMode;
      sortMode.value = colorFilterStore.sortMode;
    } catch {
      // Ignore load errors
    }
  }

  async function saveSettings() {
    try {
      await colorFilterStore.updateExcludedColors([...excludedColors.value]);
      await colorFilterStore.updateViewMode(viewMode.value);
      await colorFilterStore.updateSortMode(sortMode.value);
    } catch {
      // Ignore save errors
    }
  }

  // Initialize
  loadSettings();

  // Auto-load colors from first template when templates are loaded
  let initialized = false;
  watch(
    () => templateStore.templates.length,
    (newLength) => {
      if (newLength > 0 && !initialized) {
        loadTemplateColors(0);
        initialized = true;
      }
    },
    { immediate: true }
  );

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
    saveSettings,
  };
}

export const useColorFilter = createSharedComposable(_useColorFilter);
