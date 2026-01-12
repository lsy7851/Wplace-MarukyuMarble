/**
 * Color Filter Store
 * 
 * Central state management for color filter preferences
 * Uses chrome.storage.sync for cross-device synchronization
 * 
 * Storage keys use 'mm' prefix (Marukyu Marble)
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { chromeStorageCompat } from '@/utils/storageCompat.js';

// Storage key prefix
const KEY_PREFIX = 'mm';

// Storage keys
const STORAGE_KEYS = {
    EXCLUDED_COLORS: `${KEY_PREFIX}ExcludedColors`,
    VIEW_MODE: `${KEY_PREFIX}ViewPreference`,
    SORT_MODE: `${KEY_PREFIX}SortPreference`,
    COMPACT_COLLAPSED: `${KEY_PREFIX}CompactCollapsed`,
    COMPACT_SORT: `${KEY_PREFIX}CompactSort`,
};

// Default values
const DEFAULTS = {
    excludedColors: [],
    viewMode: 'grid',
    sortMode: 'default',
    compactCollapsed: false,
    compactSort: 'default',
};

export const useColorFilterStore = defineStore('colorFilter', () => {
    // ========================================
    // State
    // ========================================

    const excludedColors = ref([...DEFAULTS.excludedColors]);
    const viewMode = ref(DEFAULTS.viewMode);
    const sortMode = ref(DEFAULTS.sortMode);
    const compactCollapsed = ref(DEFAULTS.compactCollapsed);
    const compactSort = ref(DEFAULTS.compactSort);

    // Initialization flag
    const isInitialized = ref(false);

    // ========================================
    // Actions
    // ========================================

    /**
     * Load all settings from chrome.storage.sync
     */
    async function loadSettings() {
        try {
            const storageKeys = Object.values(STORAGE_KEYS);
            const result = await chromeStorageCompat.sync.get(storageKeys);

            if (result[STORAGE_KEYS.EXCLUDED_COLORS] !== undefined) {
                excludedColors.value = result[STORAGE_KEYS.EXCLUDED_COLORS];
            }
            if (result[STORAGE_KEYS.VIEW_MODE] !== undefined) {
                viewMode.value = result[STORAGE_KEYS.VIEW_MODE];
            }
            if (result[STORAGE_KEYS.SORT_MODE] !== undefined) {
                sortMode.value = result[STORAGE_KEYS.SORT_MODE];
            }
            if (result[STORAGE_KEYS.COMPACT_COLLAPSED] !== undefined) {
                compactCollapsed.value = result[STORAGE_KEYS.COMPACT_COLLAPSED];
            }
            if (result[STORAGE_KEYS.COMPACT_SORT] !== undefined) {
                compactSort.value = result[STORAGE_KEYS.COMPACT_SORT];
            }

            isInitialized.value = true;
            console.log('✅ Color filter settings loaded from chrome.storage.sync');
        } catch (error) {
            console.error('❌ Failed to load color filter settings:', error);
            isInitialized.value = true;
        }
    }

    /**
     * Save all settings to chrome.storage.sync
     */
    async function saveAllSettings() {
        try {
            const plainSettings = {
                [STORAGE_KEYS.EXCLUDED_COLORS]: JSON.parse(JSON.stringify(excludedColors.value)),
                [STORAGE_KEYS.VIEW_MODE]: viewMode.value,
                [STORAGE_KEYS.SORT_MODE]: sortMode.value,
                [STORAGE_KEYS.COMPACT_COLLAPSED]: compactCollapsed.value,
                [STORAGE_KEYS.COMPACT_SORT]: compactSort.value,
            };

            await chromeStorageCompat.sync.set(plainSettings);
            console.log('✅ Color filter settings saved to chrome.storage.sync');
        } catch (error) {
            console.error('❌ Failed to save color filter settings:', error);
            throw error;
        }
    }

    /**
     * Save individual setting
     */
    async function saveSetting(key, value) {
        try {
            const plainValue = typeof value === 'object' && value !== null
                ? JSON.parse(JSON.stringify(value))
                : value;

            await chromeStorageCompat.sync.set({ [key]: plainValue });
        } catch (error) {
            console.error(`❌ Failed to save setting ${key}:`, error);
            throw error;
        }
    }

    /**
     * Update excluded colors
     */
    async function updateExcludedColors(colors) {
        excludedColors.value = colors;
        await saveSetting(STORAGE_KEYS.EXCLUDED_COLORS, colors);
    }

    /**
     * Toggle color excluded state
     */
    async function toggleColorExcluded(colorKey) {
        const index = excludedColors.value.indexOf(colorKey);
        if (index > -1) {
            excludedColors.value.splice(index, 1);
        } else {
            excludedColors.value.push(colorKey);
        }
        await saveSetting(STORAGE_KEYS.EXCLUDED_COLORS, excludedColors.value);
    }

    /**
     * Update view mode
     */
    async function updateViewMode(mode) {
        viewMode.value = mode;
        await saveSetting(STORAGE_KEYS.VIEW_MODE, mode);
    }

    /**
     * Update sort mode
     */
    async function updateSortMode(mode) {
        sortMode.value = mode;
        await saveSetting(STORAGE_KEYS.SORT_MODE, mode);
    }

    /**
     * Update compact collapsed state
     */
    async function updateCompactCollapsed(collapsed) {
        compactCollapsed.value = collapsed;
        await saveSetting(STORAGE_KEYS.COMPACT_COLLAPSED, collapsed);
    }

    /**
     * Update compact sort
     */
    async function updateCompactSort(sort) {
        compactSort.value = sort;
        await saveSetting(STORAGE_KEYS.COMPACT_SORT, sort);
    }

    /**
     * Reset all settings to defaults
     */
    async function resetSettings() {
        try {
            excludedColors.value = [...DEFAULTS.excludedColors];
            viewMode.value = DEFAULTS.viewMode;
            sortMode.value = DEFAULTS.sortMode;
            compactCollapsed.value = DEFAULTS.compactCollapsed;
            compactSort.value = DEFAULTS.compactSort;

            await saveAllSettings();
            console.log('✅ Color filter settings reset to defaults');
        } catch (error) {
            console.error('❌ Failed to reset color filter settings:', error);
            throw error;
        }
    }

    // ========================================
    // Initialize on store creation
    // ========================================

    if (!isInitialized.value) {
        loadSettings();
    }

    return {
        // State
        excludedColors,
        viewMode,
        sortMode,
        compactCollapsed,
        compactSort,
        isInitialized,

        // Actions
        loadSettings,
        saveAllSettings,
        saveSetting,
        updateExcludedColors,
        toggleColorExcluded,
        updateViewMode,
        updateSortMode,
        updateCompactCollapsed,
        updateCompactSort,
        resetSettings,
    };
});
