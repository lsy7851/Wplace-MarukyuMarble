/**
 * Settings Management Composable
 *
 * DEPRECATED: This file is kept for backward compatibility only.
 * New code should use useSettingsStore directly from '@/stores/settingsStore.js'
 *
 * This composable provides a convenience wrapper around the settings store,
 * but it's recommended to use the store directly for better type safety and clarity.
 */

import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore.js';

/**
 * useSettings Composable
 * Provides reactive settings management with backward compatibility
 *
 * @deprecated Use useSettingsStore directly instead
 */
export function useSettings() {
  const settingsStore = useSettingsStore();

  // Backward compatibility: provide a 'settings' ref that contains all settings
  const settings = computed(() => settingsStore.getCurrentSettings());

  return {
    // Backward compatibility
    settings,
    loadSettings: settingsStore.loadSettings,

    // Direct access to store refs
    ...storeToRefs(settingsStore),

    // Actions
    saveAllSettings: settingsStore.saveAllSettings,
    applySettings: settingsStore.applySettings,
    resetSettings: settingsStore.resetSettings,
    getCurrentSettings: settingsStore.getCurrentSettings,

    // Individual update functions
    updateCrosshairColor: settingsStore.updateCrosshairColor,
    updateCrosshairBorder: settingsStore.updateCrosshairBorder,
    updateCrosshairEnhancedSize: settingsStore.updateCrosshairEnhancedSize,
    updateCrosshairRadius: settingsStore.updateCrosshairRadius,
    updateMiniTrackerEnabled: settingsStore.updateMiniTrackerEnabled,
    updateCollapseMinEnabled: settingsStore.updateCollapseMinEnabled,
    updateMobileMode: settingsStore.updateMobileMode,
    updateDragMode: settingsStore.updateDragMode,
    updateShowUsername: settingsStore.updateShowUsername,
    updateTileRefreshPaused: settingsStore.updateTileRefreshPaused,
    updateSmartCacheEnabled: settingsStore.updateSmartCacheEnabled,
    updateSmartDetectionEnabled: settingsStore.updateSmartDetectionEnabled,
    updateNavigationMethod: settingsStore.updateNavigationMethod,
    updateTemplateColorSort: settingsStore.updateTemplateColorSort,
    updateCompactSort: settingsStore.updateCompactSort,
  };
}
