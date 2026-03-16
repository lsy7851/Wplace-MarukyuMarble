/**
 * UI Settings Sub-module
 *
 * Manages miniTracker, collapse, mobile, drag, visibility toggles,
 * navigation, and sorting settings.
 */

import { ref } from 'vue';
import { STORAGE_KEYS, DEFAULTS } from './storageKeys.js';

export function createUiSettings(saveSetting) {
  // UI settings
  const miniTrackerEnabled = ref(DEFAULTS.miniTrackerEnabled);
  const collapseMinEnabled = ref(DEFAULTS.collapseMinEnabled);
  const mobileMode = ref(DEFAULTS.mobileMode);
  const dragMode = ref(DEFAULTS.dragMode);

  // Visibility settings
  const showInformationHeader = ref(DEFAULTS.showInformationHeader);
  const showTemplateHeader = ref(DEFAULTS.showTemplateHeader);
  const showUsername = ref(DEFAULTS.showUsername);
  const showDroplets = ref(DEFAULTS.showDroplets);
  const showNextLevel = ref(DEFAULTS.showNextLevel);
  const showFullCharge = ref(DEFAULTS.showFullCharge);
  const showColorMenu = ref(DEFAULTS.showColorMenu);
  const colorMenuHeight = ref(DEFAULTS.colorMenuHeight);

  // Navigation settings
  const navigationMethod = ref(DEFAULTS.navigationMethod);

  // Sorting settings
  const templateColorSort = ref(DEFAULTS.templateColorSort);
  const compactSort = ref(DEFAULTS.compactSort);

  function loadFromStorage(result) {
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
    if (result[STORAGE_KEYS.SHOW_INFORMATION_HEADER] !== undefined) {
      showInformationHeader.value = result[STORAGE_KEYS.SHOW_INFORMATION_HEADER];
    }
    if (result[STORAGE_KEYS.SHOW_TEMPLATE_HEADER] !== undefined) {
      showTemplateHeader.value = result[STORAGE_KEYS.SHOW_TEMPLATE_HEADER];
    }
    if (result[STORAGE_KEYS.SHOW_USERNAME] !== undefined) {
      showUsername.value = result[STORAGE_KEYS.SHOW_USERNAME];
    }
    if (result[STORAGE_KEYS.SHOW_DROPLETS] !== undefined) {
      showDroplets.value = result[STORAGE_KEYS.SHOW_DROPLETS];
    }
    if (result[STORAGE_KEYS.SHOW_NEXT_LEVEL] !== undefined) {
      showNextLevel.value = result[STORAGE_KEYS.SHOW_NEXT_LEVEL];
    }
    if (result[STORAGE_KEYS.SHOW_FULL_CHARGE] !== undefined) {
      showFullCharge.value = result[STORAGE_KEYS.SHOW_FULL_CHARGE];
    }
    if (result[STORAGE_KEYS.SHOW_COLOR_MENU] !== undefined) {
      showColorMenu.value = result[STORAGE_KEYS.SHOW_COLOR_MENU];
    }
    if (result[STORAGE_KEYS.COLOR_MENU_HEIGHT] !== undefined) {
      colorMenuHeight.value = result[STORAGE_KEYS.COLOR_MENU_HEIGHT];
    }
    if (result[STORAGE_KEYS.NAVIGATION_METHOD] !== undefined) {
      navigationMethod.value = result[STORAGE_KEYS.NAVIGATION_METHOD];
    }
    if (result[STORAGE_KEYS.TEMPLATE_COLOR_SORT] !== undefined) {
      templateColorSort.value = result[STORAGE_KEYS.TEMPLATE_COLOR_SORT];
    }
    if (result[STORAGE_KEYS.COMPACT_SORT] !== undefined) {
      compactSort.value = result[STORAGE_KEYS.COMPACT_SORT];
    }
  }

  function getStorageData() {
    return {
      [STORAGE_KEYS.MINI_TRACKER_ENABLED]: miniTrackerEnabled.value,
      [STORAGE_KEYS.COLLAPSE_MIN_ENABLED]: collapseMinEnabled.value,
      [STORAGE_KEYS.MOBILE_MODE]: mobileMode.value,
      [STORAGE_KEYS.DRAG_MODE]: dragMode.value,
      [STORAGE_KEYS.SHOW_INFORMATION_HEADER]: showInformationHeader.value,
      [STORAGE_KEYS.SHOW_TEMPLATE_HEADER]: showTemplateHeader.value,
      [STORAGE_KEYS.SHOW_USERNAME]: showUsername.value,
      [STORAGE_KEYS.SHOW_DROPLETS]: showDroplets.value,
      [STORAGE_KEYS.SHOW_NEXT_LEVEL]: showNextLevel.value,
      [STORAGE_KEYS.SHOW_FULL_CHARGE]: showFullCharge.value,
      [STORAGE_KEYS.SHOW_COLOR_MENU]: showColorMenu.value,
      [STORAGE_KEYS.COLOR_MENU_HEIGHT]: colorMenuHeight.value,
      [STORAGE_KEYS.NAVIGATION_METHOD]: navigationMethod.value,
      [STORAGE_KEYS.TEMPLATE_COLOR_SORT]: templateColorSort.value,
      [STORAGE_KEYS.COMPACT_SORT]: compactSort.value,
    };
  }

  function applySettings(settings) {
    miniTrackerEnabled.value = settings.miniTrackerEnabled;
    collapseMinEnabled.value = settings.collapseMinEnabled;
    mobileMode.value = settings.mobileMode;
    dragMode.value = settings.dragMode;
    showInformationHeader.value = settings.showInformationHeader;
    showTemplateHeader.value = settings.showTemplateHeader;
    showUsername.value = settings.showUsername;
    showDroplets.value = settings.showDroplets;
    showNextLevel.value = settings.showNextLevel;
    showFullCharge.value = settings.showFullCharge;
    showColorMenu.value = settings.showColorMenu;
    navigationMethod.value = settings.navigationMethod;
    templateColorSort.value = settings.templateColorSort;
    compactSort.value = settings.compactSort;
  }

  function resetToDefaults() {
    miniTrackerEnabled.value = DEFAULTS.miniTrackerEnabled;
    collapseMinEnabled.value = DEFAULTS.collapseMinEnabled;
    mobileMode.value = DEFAULTS.mobileMode;
    dragMode.value = DEFAULTS.dragMode;
    showInformationHeader.value = DEFAULTS.showInformationHeader;
    showTemplateHeader.value = DEFAULTS.showTemplateHeader;
    showUsername.value = DEFAULTS.showUsername;
    showDroplets.value = DEFAULTS.showDroplets;
    showNextLevel.value = DEFAULTS.showNextLevel;
    showFullCharge.value = DEFAULTS.showFullCharge;
    showColorMenu.value = DEFAULTS.showColorMenu;
    navigationMethod.value = DEFAULTS.navigationMethod;
    templateColorSort.value = DEFAULTS.templateColorSort;
    compactSort.value = DEFAULTS.compactSort;
  }

  function getCurrentSettings() {
    return {
      miniTrackerEnabled: miniTrackerEnabled.value,
      collapseMinEnabled: collapseMinEnabled.value,
      mobileMode: mobileMode.value,
      dragMode: dragMode.value,
      showInformationHeader: showInformationHeader.value,
      showTemplateHeader: showTemplateHeader.value,
      showUsername: showUsername.value,
      showDroplets: showDroplets.value,
      showNextLevel: showNextLevel.value,
      showFullCharge: showFullCharge.value,
      showColorMenu: showColorMenu.value,
      navigationMethod: navigationMethod.value,
      templateColorSort: templateColorSort.value,
      compactSort: compactSort.value,
    };
  }

  async function updateMiniTrackerEnabled(enabled) {
    miniTrackerEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.MINI_TRACKER_ENABLED, enabled);
  }

  async function updateCollapseMinEnabled(enabled) {
    collapseMinEnabled.value = enabled;
    await saveSetting(STORAGE_KEYS.COLLAPSE_MIN_ENABLED, enabled);
  }

  async function updateMobileMode(enabled) {
    mobileMode.value = enabled;
    await saveSetting(STORAGE_KEYS.MOBILE_MODE, enabled);
  }

  async function updateDragMode(enabled) {
    dragMode.value = enabled;
    await saveSetting(STORAGE_KEYS.DRAG_MODE, enabled);
  }

  async function updateShowUsername(enabled) {
    showUsername.value = enabled;
    await saveSetting(STORAGE_KEYS.SHOW_USERNAME, enabled);
  }

  async function updateNavigationMethod(method) {
    navigationMethod.value = method;
    await saveSetting(STORAGE_KEYS.NAVIGATION_METHOD, method);
  }

  async function updateTemplateColorSort(sort) {
    templateColorSort.value = sort;
    await saveSetting(STORAGE_KEYS.TEMPLATE_COLOR_SORT, sort);
  }

  async function updateCompactSort(sort) {
    compactSort.value = sort;
    await saveSetting(STORAGE_KEYS.COMPACT_SORT, sort);
  }

  async function updateColorMenuHeight(height) {
    colorMenuHeight.value = height;
    await saveSetting(STORAGE_KEYS.COLOR_MENU_HEIGHT, height);
  }

  return {
    // State
    miniTrackerEnabled,
    collapseMinEnabled,
    mobileMode,
    dragMode,
    showInformationHeader,
    showTemplateHeader,
    showUsername,
    showDroplets,
    showNextLevel,
    showFullCharge,
    showColorMenu,
    colorMenuHeight,
    navigationMethod,
    templateColorSort,
    compactSort,

    // Internal
    loadFromStorage,
    getStorageData,
    applySettings,
    resetToDefaults,
    getCurrentSettings,

    // Actions
    updateMiniTrackerEnabled,
    updateCollapseMinEnabled,
    updateMobileMode,
    updateDragMode,
    updateShowUsername,
    updateNavigationMethod,
    updateTemplateColorSort,
    updateCompactSort,
    updateColorMenuHeight,
  };
}
