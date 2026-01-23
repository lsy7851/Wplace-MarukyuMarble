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
import { computed } from 'vue';
import { useTemplateStore } from '@/stores/templateStore';
import { colorPalette as GLOBAL_PALETTE, getColorKey } from '@/utils/colorpalette';

/**
 * Color filtering composable
 *
 * Manages color filtering for a specific template
 * @param {number|Ref<number>} templateIndex - Template index in store
 */
export function useColorFiltering(templateIndex) {
  const templateStore = useTemplateStore();

  const template = computed(() => {
    const index = typeof templateIndex === 'object' ? templateIndex.value : templateIndex;
    return templateStore.templates[index];
  });

  /**
   * Get color palette with filtering state
   * Merges global palette (for fixed 64 colors) with detected template colors
   */
  const colorPalette = computed(() => {
    if (!template.value) return {};

    const palette = {};

    // 1. Initialize with Global Palette (ensure all 64 colors exist)
    GLOBAL_PALETTE.forEach(def => {
      let key = getColorKey(def.rgb);

      // Handle Transparent specially to avoid key collision with Black
      if (def.name === 'Transparent') {
        key = 'transparent';
      }

      palette[key] = {
        enabled: true, // Default
        count: 0,
        ...def,
        colorKey: key
      };
    });

    // 2. Merge detected colors from template
    for (const [key, data] of Object.entries(template.value.colorPalette)) {
      if (!palette[key]) {
        // Custom/Extra color not in global palette
        palette[key] = {
          ...data,
          name: getColorName(key),
          rgb: parseColorKey(key),
          colorKey: key,
          disabled: false,
          enhanced: false
        };
      } else {
        // Update existing global color with actual data
        palette[key] = {
          ...palette[key],
          ...data
        };
      }
    }

    // 3. Special handling for Transparent stats
    if (palette['transparent']) {
      palette['transparent'].count = template.value.transparentPixelCount || 0;
    }

    // 4. Update status (disabled/enhanced) for all keys
    for (const key of Object.keys(palette)) {
      const rgb = parseColorKey(key);
      // parseColorKey('transparent') returns [0,0,0]
      // This replicates legacy behavior where transparent key is treated same as black
      palette[key].disabled = template.value.isColorDisabled(rgb);
      palette[key].enhanced = template.value.isColorEnhanced(rgb);
    }

    return palette;
  });

  /**
   * Get sorted colors by various criteria
   * @param {string} sortBy - Sort option ('default', 'premium', 'most-wrong', 'most-missing', 'painted')
   * @returns {Array<[string, object]>} Sorted color entries
   */
  function getSortedColors(sortBy = 'default') {
    const colors = Object.entries(colorPalette.value);

    switch (sortBy) {
      case 'premium':
        // Premium colors first (based on Wplace palette order)
        return colors.sort((a, b) => {
          const isPremiumA = isPremiumColor(a[0]);
          const isPremiumB = isPremiumColor(b[0]);
          if (isPremiumA && !isPremiumB) return -1;
          if (!isPremiumA && isPremiumB) return 1;
          return 0;
        });

      case 'most-wrong':
        // Sort by wrong pixel count (descending)
        return colors.sort((a, b) => {
          const wrongA = a[1].wrong || 0;
          const wrongB = b[1].wrong || 0;
          return wrongB - wrongA;
        });

      case 'most-missing':
        // Sort by remaining pixels (descending)
        return colors.sort((a, b) => {
          const remainingA = (a[1].required || 0) - (a[1].painted || 0);
          const remainingB = (b[1].required || 0) - (b[1].painted || 0);
          return remainingB - remainingA;
        });

      case 'painted':
        // Sort by painted percentage (ascending - least painted first)
        return colors.sort((a, b) => {
          const percentA = (a[1].required || 0) > 0
            ? ((a[1].painted || 0) / a[1].required) * 100
            : 100;
          const percentB = (b[1].required || 0) > 0
            ? ((b[1].painted || 0) / b[1].required) * 100
            : 100;
          return percentA - percentB;
        });

      case 'default':
      default:
        // Default order (as they appear in palette)
        return colors;
    }
  }

  /**
   * Toggle color disabled state
   * @param {string} colorKey - Color key "r,g,b"
   */
  async function toggleColorDisabled(colorKey) {
    if (!template.value) return;

    const rgb = parseColorKey(colorKey);
    const isDisabled = template.value.isColorDisabled(rgb);

    if (isDisabled) {
      template.value.enableColor(rgb);
    } else {
      template.value.disableColor(rgb);
    }

    await templateStore.saveTemplates();
    templateStore.clearTileProgress();

    console.log(`Color ${colorKey} ${isDisabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle color enhanced state
   * @param {string} colorKey - Color key "r,g,b"
   */
  async function toggleColorEnhanced(colorKey) {
    if (!template.value) return;

    const rgb = parseColorKey(colorKey);
    const isEnhanced = template.value.isColorEnhanced(rgb);

    if (isEnhanced) {
      template.value.disableColorEnhanced(rgb);
    } else {
      template.value.enableColorEnhanced(rgb);
    }

    await templateStore.saveTemplates();
    templateStore.clearTileProgress();

    console.log(`Color ${colorKey} ${isEnhanced ? 'un-enhanced' : 'enhanced'}`);
  }

  /**
   * Disable all colors
   */
  async function disableAllColors() {
    if (!template.value) return;

    for (const colorKey of Object.keys(colorPalette.value)) {
      const rgb = parseColorKey(colorKey);
      template.value.disableColor(rgb);
    }

    await templateStore.saveTemplates();
    templateStore.clearTileProgress();

    console.log('All colors disabled');
  }

  /**
   * Enable all colors
   */
  async function enableAllColors() {
    if (!template.value) return;

    template.value.disabledColors.clear();

    await templateStore.saveTemplates();
    templateStore.clearTileProgress();

    console.log('All colors enabled');
  }

  /**
   * Enable only specific colors (disable all others)
   * @param {string[]} colorKeys - Array of color keys to enable
   */
  async function enableOnlyColors(colorKeys) {
    if (!template.value) return;

    // Disable all first
    const allColorKeys = Object.keys(colorPalette.value);
    for (const key of allColorKeys) {
      const rgb = parseColorKey(key);
      template.value.disableColor(rgb);
    }

    // Enable only specified
    for (const key of colorKeys) {
      const rgb = parseColorKey(key);
      template.value.enableColor(rgb);
    }

    await templateStore.saveTemplates();
    templateStore.clearTileProgress();

    console.log(`Enabled only ${colorKeys.length} colors`);
  }

  /**
   * Parse color key "r,g,b" to [r, g, b]
   * Handles "transparent" key by returning [0, 0, 0] (same as black)
   * @param {string} key - Color key
   * @returns {[number, number, number]}
   */
  function parseColorKey(key) {
    if (key === 'transparent') {
      return [0, 0, 0];
    }
    return key.split(',').map(Number);
  }

  /**
   * Convert RGB array to hex string
   * @param {string} colorKey - Color key "r,g,b"
   * @returns {string} Hex color "#rrggbb"
   */
  function colorKeyToHex(colorKey) {
    const [r, g, b] = parseColorKey(colorKey);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get color name (basic palette)
   * @param {string} colorKey - Color key "r,g,b"
   * @returns {string} Color name
   */
  function getColorName(colorKey) {
    if (colorKey === 'transparent') return 'Transparent';

    const names = {
      '255,255,255': 'White',
      '0,0,0': 'Black',
      '255,0,0': 'Red',
      '0,255,0': 'Green',
      '0,0,255': 'Blue',
      '255,255,0': 'Yellow',
      '255,0,255': 'Magenta',
      '0,255,255': 'Cyan',
      '128,128,128': 'Gray',
      '192,192,192': 'Silver',
      '128,0,0': 'Maroon',
      '0,128,0': 'Dark Green',
      '0,0,128': 'Navy',
      '255,165,0': 'Orange',
      '128,0,128': 'Purple',
      '255,192,203': 'Pink'
    };

    return names[colorKey] || colorKey;
  }

  /**
   * Check if color is premium (based on Wplace palette)
   * Premium colors are typically first 16 colors in palette
   * @param {string} colorKey - Color key "r,g,b"
   * @returns {boolean}
   */
  function isPremiumColor(colorKey) {
    if (colorKey === 'transparent') return true;

    // Common premium colors (basic palette)
    const premiumColors = [
      '255,255,255', '0,0,0', '255,0,0', '0,255,0',
      '0,0,255', '255,255,0', '255,0,255', '0,255,255',
      '128,128,128', '192,192,192', '128,0,0', '0,128,0',
      '0,0,128', '255,165,0', '128,0,128', '255,192,203'
    ];

    return premiumColors.includes(colorKey);
  }

  /**
   * Search colors by name or RGB
   * @param {string} query - Search query
   * @returns {Array<[string, object]>} Filtered colors
   */
  function searchColors(query) {
    if (!query) return Object.entries(colorPalette.value);

    const lowerQuery = query.toLowerCase();
    return Object.entries(colorPalette.value).filter(([key, data]) => {
      const name = getColorName(key).toLowerCase();
      return name.includes(lowerQuery) || key.includes(lowerQuery);
    });
  }

  return {
    template,
    colorPalette,
    getSortedColors,
    toggleColorDisabled,
    toggleColorEnhanced,
    disableAllColors,
    enableAllColors,
    enableOnlyColors,
    parseColorKey,
    colorKeyToHex,
    getColorName,
    isPremiumColor,
    searchColors
  };
}
