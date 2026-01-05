/**
 * Settings Management Composable
 *
 * Handles storage and retrieval of extension settings using chrome.storage.sync
 * Uses chromeStorageCompat for MAIN world compatibility
 *
 * Note: Using sync storage enables cross-device synchronization when user is signed in to Chrome
 */

import { ref } from 'vue';
import { chromeStorageCompat } from '@/utils/storageCompat.js';

// Setting keys (storage keys with 'mm' prefix)
const STORAGE_KEYS = {
  SHOW_USERNAME: 'mmShowUsername',
  NAVIGATION_METHOD: 'mmNavigationMethod',
};

// Default values
const DEFAULTS = {
  showUsername: true,
  navigationMethod: 'flyto', // 'flyto' | 'openurl'
};

// Mapping between variable names and storage keys
const KEY_MAPPING = {
  showUsername: STORAGE_KEYS.SHOW_USERNAME,
  navigationMethod: STORAGE_KEYS.NAVIGATION_METHOD,
};

// Reactive state (singleton - module level)
const settings = ref({
  showUsername: DEFAULTS.showUsername,
  navigationMethod: DEFAULTS.navigationMethod,
});

// Flag to track if settings have been loaded
let isInitialized = false;

/**
 * Load all settings from chrome.storage.sync
 * Sets default values if not found in storage
 */
async function loadSettings() {
  try {
    // Get all storage keys to load
    const storageKeys = Object.values(STORAGE_KEYS);
    const result = await chromeStorageCompat.sync.get(storageKeys);

    // Apply loaded values or defaults
    for (const [varName, defaultValue] of Object.entries(DEFAULTS)) {
      const storageKey = KEY_MAPPING[varName];

      if (result[storageKey] !== undefined) {
        settings.value[varName] = result[storageKey];
      } else {
        // If setting doesn't exist in storage, save the default value
        settings.value[varName] = defaultValue;
        await chromeStorageCompat.sync.set({ [storageKey]: defaultValue });
      }
    }

    isInitialized = true;
  } catch (error) {
    console.error('❌ Failed to load settings:', error);
    // Fallback to defaults on error
    settings.value = { ...DEFAULTS };
  }
}

/**
 * Save a specific setting to chrome.storage.sync
 * @param {string} varName - Variable name (e.g., 'showUsername')
 * @param {*} value - Setting value
 */
async function saveSetting(varName, value) {
  try {
    const storageKey = KEY_MAPPING[varName];
    if (!storageKey) {
      throw new Error(`Unknown setting: ${varName}`);
    }

    await chromeStorageCompat.sync.set({ [storageKey]: value });
    settings.value[varName] = value;
  } catch (error) {
    console.error(`❌ Failed to save setting ${varName}:`, error);
    throw error;
  }
}

/**
 * Get current value of a setting
 * @param {string} varName - Variable name (e.g., 'showUsername')
 * @returns {*} Current setting value
 */
function getSetting(varName) {
  return settings.value[varName];
}

/**
 * useSettings Composable
 * Provides reactive settings management
 */
export function useSettings() {
  // Initialize settings on first use
  if (!isInitialized) {
    loadSettings();
  }

  return {
    settings,
    loadSettings,
    saveSetting,
    getSetting,
  };
}
