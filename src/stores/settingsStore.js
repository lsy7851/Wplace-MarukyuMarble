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
/**
 * Settings Store (Composition Root)
 *
 * Central state management for all Marukyu Marble settings.
 * Delegates to domain-specific sub-modules while maintaining
 * the same public API for consumers.
 *
 * Uses chrome.storage.sync for cross-device synchronization.
 * Storage keys use 'mm' prefix (Marukyu Marble).
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { chromeStorageCompat } from '@/utils/storageCompat.js';
import { STORAGE_KEYS } from './settings/storageKeys.js';
import { createCrosshairSettings } from './settings/crosshairSettings.js';
import { createUiSettings } from './settings/uiSettings.js';
import { createPerformanceSettings } from './settings/performanceSettings.js';
import { createErrorMapSettings } from './settings/errorMapSettings.js';

export const useSettingsStore = defineStore('settings', () => {
  // Initialization flag
  const isInitialized = ref(false);

  // ========================================
  // Shared utility for sub-modules
  // ========================================

  async function saveSetting(key, value) {
    try {
      const plainValue =
        typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value;
      await chromeStorageCompat.sync.set({ [key]: plainValue });
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // Initialize sub-modules
  // ========================================

  const crosshair = createCrosshairSettings(saveSetting);
  const ui = createUiSettings(saveSetting);
  const performance = createPerformanceSettings(saveSetting);
  const errorMap = createErrorMapSettings(saveSetting);

  // ========================================
  // Orchestration Actions
  // ========================================

  async function loadSettings() {
    try {
      const storageKeys = Object.values(STORAGE_KEYS);
      const result = await chromeStorageCompat.sync.get(storageKeys);

      crosshair.loadFromStorage(result);
      ui.loadFromStorage(result);
      performance.loadFromStorage(result);
      errorMap.loadFromStorage(result);

      isInitialized.value = true;
    } catch {
      isInitialized.value = true;
    }
  }

  async function saveAllSettings() {
    try {
      const plainSettings = {
        ...crosshair.getStorageData(),
        ...ui.getStorageData(),
        ...performance.getStorageData(),
        ...errorMap.getStorageData(),
      };
      await chromeStorageCompat.sync.set(plainSettings);
    } catch (error) {
      throw error;
    }
  }

  async function applySettings(settings) {
    try {
      crosshair.applySettings(settings);
      ui.applySettings(settings);
      performance.applySettings(settings);
      errorMap.applySettings(settings);
      await saveAllSettings();
    } catch (error) {
      throw error;
    }
  }

  async function resetSettings() {
    try {
      crosshair.resetToDefaults();
      ui.resetToDefaults();
      performance.resetToDefaults();
      errorMap.resetToDefaults();
      await saveAllSettings();
    } catch (error) {
      throw error;
    }
  }

  function getCurrentSettings() {
    return {
      ...crosshair.getCurrentSettings(),
      ...ui.getCurrentSettings(),
      ...performance.getCurrentSettings(),
      ...errorMap.getCurrentSettings(),
    };
  }

  // ========================================
  // Initialize on store creation
  // ========================================

  if (!isInitialized.value) {
    loadSettings();
  }

  return {
    // State - Crosshair
    crosshairColor: crosshair.crosshairColor,
    crosshairBorder: crosshair.crosshairBorder,
    crosshairEnhancedSize: crosshair.crosshairEnhancedSize,
    crosshairRadius: crosshair.crosshairRadius,

    // State - UI
    miniTrackerEnabled: ui.miniTrackerEnabled,
    collapseMinEnabled: ui.collapseMinEnabled,
    mobileMode: ui.mobileMode,
    dragMode: ui.dragMode,
    showInformationHeader: ui.showInformationHeader,
    showTemplateHeader: ui.showTemplateHeader,
    showUsername: ui.showUsername,
    showDroplets: ui.showDroplets,
    showNextLevel: ui.showNextLevel,
    showFullCharge: ui.showFullCharge,
    showColorMenu: ui.showColorMenu,
    colorMenuHeight: ui.colorMenuHeight,
    navigationMethod: ui.navigationMethod,
    templateColorSort: ui.templateColorSort,
    compactSort: ui.compactSort,

    // State - Performance
    tileRefreshPaused: performance.tileRefreshPaused,
    smartCacheEnabled: performance.smartCacheEnabled,
    smartDetectionEnabled: performance.smartDetectionEnabled,
    tileCacheVersion: performance.tileCacheVersion,
    tileCacheStats: performance.tileCacheStats,

    // State - Error Map
    enhanceWrongColors: errorMap.enhanceWrongColors,
    errorMapEnabled: errorMap.errorMapEnabled,
    showWrongPixels: errorMap.showWrongPixels,
    showCorrectPixels: errorMap.showCorrectPixels,
    showUnpaintedAsWrong: errorMap.showUnpaintedAsWrong,

    isInitialized,

    // Orchestration Actions
    loadSettings,
    saveAllSettings,
    saveSetting,
    applySettings,
    resetSettings,
    getCurrentSettings,

    // Crosshair Actions
    updateCrosshairColor: crosshair.updateCrosshairColor,
    updateCrosshairBorder: crosshair.updateCrosshairBorder,
    updateCrosshairEnhancedSize: crosshair.updateCrosshairEnhancedSize,
    updateCrosshairRadius: crosshair.updateCrosshairRadius,

    // UI Actions
    updateMiniTrackerEnabled: ui.updateMiniTrackerEnabled,
    updateCollapseMinEnabled: ui.updateCollapseMinEnabled,
    updateMobileMode: ui.updateMobileMode,
    updateDragMode: ui.updateDragMode,
    updateShowUsername: ui.updateShowUsername,
    updateNavigationMethod: ui.updateNavigationMethod,
    updateTemplateColorSort: ui.updateTemplateColorSort,
    updateCompactSort: ui.updateCompactSort,
    updateColorMenuHeight: ui.updateColorMenuHeight,

    // Performance Actions
    updateTileRefreshPaused: performance.updateTileRefreshPaused,
    updateSmartCacheEnabled: performance.updateSmartCacheEnabled,
    updateSmartDetectionEnabled: performance.updateSmartDetectionEnabled,
    updateTileCacheVersion: performance.updateTileCacheVersion,
    updateTileCacheStats: performance.updateTileCacheStats,

    // Error Map Actions
    updateEnhanceWrongColors: errorMap.updateEnhanceWrongColors,
    updateErrorMapEnabled: errorMap.updateErrorMapEnabled,
    toggleErrorMapMode: errorMap.toggleErrorMapMode,
  };
});
