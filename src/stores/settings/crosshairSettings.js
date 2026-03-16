/**
 * Crosshair Settings Sub-module
 *
 * Manages crosshair color, border, size, and radius settings.
 */

import { ref } from 'vue';
import { STORAGE_KEYS, DEFAULTS } from './storageKeys.js';

export function createCrosshairSettings(saveSetting) {
  const crosshairColor = ref({ ...DEFAULTS.crosshairColor });
  const crosshairBorder = ref(DEFAULTS.crosshairBorder);
  const crosshairEnhancedSize = ref(DEFAULTS.crosshairEnhancedSize);
  const crosshairRadius = ref(DEFAULTS.crosshairRadius);

  function loadFromStorage(result) {
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
  }

  function getStorageData() {
    return {
      [STORAGE_KEYS.CROSSHAIR_COLOR]: JSON.parse(JSON.stringify(crosshairColor.value)),
      [STORAGE_KEYS.CROSSHAIR_BORDER]: crosshairBorder.value,
      [STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE]: crosshairEnhancedSize.value,
      [STORAGE_KEYS.CROSSHAIR_RADIUS]: crosshairRadius.value,
    };
  }

  function applySettings(settings) {
    crosshairColor.value = settings.crosshairColor;
    crosshairBorder.value = settings.crosshairBorder;
    crosshairEnhancedSize.value = settings.crosshairEnhancedSize;
    crosshairRadius.value = settings.crosshairRadius;
  }

  function resetToDefaults() {
    crosshairColor.value = { ...DEFAULTS.crosshairColor };
    crosshairBorder.value = DEFAULTS.crosshairBorder;
    crosshairEnhancedSize.value = DEFAULTS.crosshairEnhancedSize;
    crosshairRadius.value = DEFAULTS.crosshairRadius;
  }

  function getCurrentSettings() {
    return {
      crosshairColor: crosshairColor.value,
      crosshairBorder: crosshairBorder.value,
      crosshairEnhancedSize: crosshairEnhancedSize.value,
      crosshairRadius: crosshairRadius.value,
    };
  }

  async function updateCrosshairColor(color) {
    crosshairColor.value = color;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_COLOR, color);
  }

  async function updateCrosshairBorder(enabled) {
    crosshairBorder.value = enabled;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_BORDER, enabled);
  }

  async function updateCrosshairEnhancedSize(enabled) {
    crosshairEnhancedSize.value = enabled;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_ENHANCED_SIZE, enabled);
  }

  async function updateCrosshairRadius(radius) {
    crosshairRadius.value = radius;
    await saveSetting(STORAGE_KEYS.CROSSHAIR_RADIUS, radius);
  }

  return {
    // State
    crosshairColor,
    crosshairBorder,
    crosshairEnhancedSize,
    crosshairRadius,

    // Internal
    loadFromStorage,
    getStorageData,
    applySettings,
    resetToDefaults,
    getCurrentSettings,

    // Actions
    updateCrosshairColor,
    updateCrosshairBorder,
    updateCrosshairEnhancedSize,
    updateCrosshairRadius,
  };
}
