/**
 * Error Map Settings Sub-module
 *
 * Manages error map enable/disable, wrong/correct pixel display,
 * and wrong color enhancement settings.
 */

import { ref } from 'vue';
import { STORAGE_KEYS, DEFAULTS } from './storageKeys.js';

export function createErrorMapSettings(saveSetting) {
  const enhanceWrongColors = ref(DEFAULTS.enhanceWrongColors);
  const errorMapEnabled = ref(DEFAULTS.errorMapEnabled);
  const showWrongPixels = ref(DEFAULTS.showWrongPixels);
  const showCorrectPixels = ref(DEFAULTS.showCorrectPixels);
  const showUnpaintedAsWrong = ref(DEFAULTS.showUnpaintedAsWrong);

  function loadFromStorage(result) {
    if (result[STORAGE_KEYS.ENHANCE_WRONG_COLORS] !== undefined) {
      enhanceWrongColors.value = result[STORAGE_KEYS.ENHANCE_WRONG_COLORS];
    }
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
  }

  function getStorageData() {
    return {
      [STORAGE_KEYS.ENHANCE_WRONG_COLORS]: enhanceWrongColors.value,
      [STORAGE_KEYS.ERROR_MAP_ENABLED]: errorMapEnabled.value,
      [STORAGE_KEYS.SHOW_WRONG_PIXELS]: showWrongPixels.value,
      [STORAGE_KEYS.SHOW_CORRECT_PIXELS]: showCorrectPixels.value,
      [STORAGE_KEYS.SHOW_UNPAINTED_AS_WRONG]: showUnpaintedAsWrong.value,
    };
  }

  function applySettings(settings) {
    enhanceWrongColors.value = settings.enhanceWrongColors;
    errorMapEnabled.value = settings.errorMapEnabled;
    showWrongPixels.value = settings.showWrongPixels;
    showCorrectPixels.value = settings.showCorrectPixels;
    showUnpaintedAsWrong.value = settings.showUnpaintedAsWrong;
  }

  function resetToDefaults() {
    enhanceWrongColors.value = DEFAULTS.enhanceWrongColors;
    errorMapEnabled.value = DEFAULTS.errorMapEnabled;
    showWrongPixels.value = DEFAULTS.showWrongPixels;
    showCorrectPixels.value = DEFAULTS.showCorrectPixels;
    showUnpaintedAsWrong.value = DEFAULTS.showUnpaintedAsWrong;
  }

  function getCurrentSettings() {
    return {
      enhanceWrongColors: enhanceWrongColors.value,
      errorMapEnabled: errorMapEnabled.value,
      showWrongPixels: showWrongPixels.value,
      showCorrectPixels: showCorrectPixels.value,
      showUnpaintedAsWrong: showUnpaintedAsWrong.value,
    };
  }

  async function updateEnhanceWrongColors(enabled) {
    enhanceWrongColors.value = enabled;
    await saveSetting(STORAGE_KEYS.ENHANCE_WRONG_COLORS, enabled);
  }

  async function updateErrorMapEnabled(enabled) {
    errorMapEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.ERROR_MAP_ENABLED, enabled);
  }

  async function toggleErrorMapMode() {
    const newState = !errorMapEnabled.value;
    await updateErrorMapEnabled(newState);
    return newState;
  }

  return {
    // State
    enhanceWrongColors,
    errorMapEnabled,
    showWrongPixels,
    showCorrectPixels,
    showUnpaintedAsWrong,

    // Internal
    loadFromStorage,
    getStorageData,
    applySettings,
    resetToDefaults,
    getCurrentSettings,

    // Actions
    updateEnhanceWrongColors,
    updateErrorMapEnabled,
    toggleErrorMapMode,
  };
}
