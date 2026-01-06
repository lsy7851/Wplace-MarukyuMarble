import { ref, computed } from 'vue';
import { colorPalette, getColorKey } from '@/utils/colorPalette.js';

/**
 * Composable for color filter functionality
 * Uses mock data until template management is implemented
 */
export function useColorFilter() {
  // Mock data state
  const excludedColors = ref([]);
  const disabledColors = ref([]);
  const enhancedColors = ref([]);
  const searchQuery = ref('');
  const sortMode = ref('default');
  const viewMode = ref('grid'); // 'grid' or 'list'

  // Mock pixel statistics
  const mockPixelStats = ref({
    '0,0,0': { totalRequired: 150, painted: 120, needsCrosshair: 30, wrong: 5 }, // Black
    '237,28,36': { totalRequired: 200, painted: 180, needsCrosshair: 20, wrong: 10 }, // Red
    '255,127,39': { totalRequired: 100, painted: 50, needsCrosshair: 50, wrong: 0 }, // Orange
    '19,230,123': { totalRequired: 80, painted: 80, needsCrosshair: 0, wrong: 0 }, // Green
    '64,147,228': { totalRequired: 120, painted: 60, needsCrosshair: 60, wrong: 8 }, // Blue
    '249,221,59': { totalRequired: 90, painted: 30, needsCrosshair: 60, wrong: 12 }, // Yellow
    '255,255,255': { totalRequired: 250, painted: 200, needsCrosshair: 50, wrong: 15 }, // White
  });

  /**
   * Get color data with statistics
   */
  const colorData = computed(() => {
    return colorPalette.map(colorInfo => {
      const colorKey = getColorKey(colorInfo.rgb);
      const stats = mockPixelStats.value[colorKey] || {
        totalRequired: 0,
        painted: 0,
        needsCrosshair: 0,
        wrong: 0
      };

      const percentage = stats.totalRequired > 0
        ? Math.round((stats.painted / stats.totalRequired) * 100)
        : 0;

      return {
        colorKey,
        colorInfo,
        stats: {
          ...stats,
          percentage
        },
        isDisabled: disabledColors.value.includes(colorKey),
        isEnhanced: enhancedColors.value.includes(colorKey),
        isExcluded: excludedColors.value.includes(colorKey)
      };
    });
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
   */
  const overallProgress = computed(() => {
    let totalRequired = 0;
    let totalPainted = 0;
    let totalWrong = 0;
    let totalRemaining = 0;

    colorData.value.forEach(c => {
      // Skip excluded colors
      if (c.isExcluded) return;

      totalRequired += c.stats.totalRequired;
      totalPainted += c.stats.painted;
      totalWrong += c.stats.wrong || 0;
      totalRemaining += c.stats.needsCrosshair || 0;
    });

    return {
      totalRequired,
      totalPainted,
      totalWrong,
      totalRemaining,
      percentage: totalRequired > 0
        ? Math.round((totalPainted / totalRequired) * 100)
        : 0
    };
  });

  // Actions

  /**
   * Toggle color enabled/disabled
   */
  function toggleColorEnabled(colorKey) {
    const index = disabledColors.value.indexOf(colorKey);
    if (index > -1) {
      disabledColors.value.splice(index, 1);
    } else {
      disabledColors.value.push(colorKey);
    }
  }

  /**
   * Toggle color enhanced mode
   */
  function toggleColorEnhanced(colorKey) {
    const index = enhancedColors.value.indexOf(colorKey);
    if (index > -1) {
      enhancedColors.value.splice(index, 1);
    } else {
      enhancedColors.value.push(colorKey);
    }
  }

  /**
   * Toggle color excluded from progress
   */
  function toggleColorExcluded(colorKey) {
    const index = excludedColors.value.indexOf(colorKey);
    if (index > -1) {
      excludedColors.value.splice(index, 1);
    } else {
      excludedColors.value.push(colorKey);
    }
  }

  /**
   * Enable all colors
   */
  function enableAllColors() {
    disabledColors.value = [];
  }

  /**
   * Disable all colors
   */
  function disableAllColors() {
    disabledColors.value = filteredColors.value.map(c => c.colorKey);
  }

  /**
   * Disable all enhanced colors
   */
  function disableAllEnhanced() {
    enhancedColors.value = [];
  }

  /**
   * Load settings from localStorage
   */
  function loadSettings() {
    try {
      const savedExcluded = localStorage.getItem('bmcf-excluded-colors');
      if (savedExcluded) {
        excludedColors.value = JSON.parse(savedExcluded);
      }

      const savedViewMode = localStorage.getItem('bmcf-view-preference');
      if (savedViewMode) {
        viewMode.value = savedViewMode;
      }

      const savedSortMode = localStorage.getItem('bmcf-sort-preference');
      if (savedSortMode) {
        sortMode.value = savedSortMode;
      }
    } catch (error) {
      console.error('Failed to load color filter settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  function saveSettings() {
    try {
      localStorage.setItem('bmcf-excluded-colors', JSON.stringify(excludedColors.value));
      localStorage.setItem('bmcf-view-preference', viewMode.value);
      localStorage.setItem('bmcf-sort-preference', sortMode.value);
    } catch (error) {
      console.error('Failed to save color filter settings:', error);
    }
  }

  // Initialize
  loadSettings();

  return {
    // State
    excludedColors,
    disabledColors,
    enhancedColors,
    searchQuery,
    sortMode,
    viewMode,

    // Computed
    colorData,
    filteredColors,
    overallProgress,

    // Methods
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
