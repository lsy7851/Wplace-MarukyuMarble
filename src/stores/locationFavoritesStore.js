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
 * Location Favorites Store - Manages favorite locations
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chromeStorageCompat } from '@/utils/storageCompat.js';

const STORAGE_KEY = 'bm-location-favorites';

export const useLocationFavoritesStore = defineStore('locationFavorites', () => {
  // State
  const favorites = ref([]);
  const isLoaded = ref(false);
  const filterQuery = ref('');

  // Computed
  const count = computed(() => favorites.value.length);

  /**
   * Filter favorites by query
   */
  const filteredFavorites = computed(() => {
    const query = filterQuery.value.toLowerCase().trim();
    if (!query) return favorites.value;

    return favorites.value.filter(fav => {
      const searchText = `${fav.primaryName || ''} ${fav.secondaryInfo || ''} ${fav.fullAddress || ''}`.toLowerCase();
      return searchText.includes(query);
    });
  });

  /**
   * Load favorites from storage (sync storage for cross-device sync)
   */
  async function loadFavorites() {
    try {
      const result = await chromeStorageCompat.sync.get(STORAGE_KEY);
      const data = result[STORAGE_KEY];
      favorites.value = Array.isArray(data) ? data : [];
      isLoaded.value = true;
    } catch {
      favorites.value = [];
      isLoaded.value = true;
    }
  }

  /**
   * Save favorites to storage (sync storage for cross-device sync)
   */
  async function saveFavorites() {
    try {
      // Deep clone to plain objects to avoid DataCloneError with postMessage
      const plainFavorites = JSON.parse(JSON.stringify(favorites.value));
      await chromeStorageCompat.sync.set({ [STORAGE_KEY]: plainFavorites });
    } catch {
      // Ignore save errors
    }
  }

  /**
   * Add location to favorites
   * @param {Object} location
   * @param {string} location.lat - Latitude
   * @param {string} location.lon - Longitude
   * @param {string} location.primaryName - Primary name
   * @param {string} [location.secondaryInfo] - Secondary info
   * @param {string} [location.fullAddress] - Full address
   */
  async function addFavorite(location) {
    // Check if already exists
    const exists = favorites.value.some(
      fav => fav.lat === location.lat && fav.lon === location.lon
    );

    if (exists) {
      return false;
    }

    favorites.value.push({
      lat: location.lat,
      lon: location.lon,
      primaryName: location.primaryName,
      secondaryInfo: location.secondaryInfo || '',
      fullAddress: location.fullAddress || '',
      addedAt: Date.now(),
    });

    await saveFavorites();
    return true;
  }

  /**
   * Remove location from favorites
   * @param {string} lat
   * @param {string} lon
   */
  async function removeFavorite(lat, lon) {
    const initialLength = favorites.value.length;
    favorites.value = favorites.value.filter(
      fav => !(fav.lat === lat && fav.lon === lon)
    );

    if (favorites.value.length < initialLength) {
      await saveFavorites();
      return true;
    }

    return false;
  }

  /**
   * Check if location is favorited
   * @param {string} lat
   * @param {string} lon
   * @returns {boolean}
   */
  function isFavorited(lat, lon) {
    return favorites.value.some(fav => fav.lat === lat && fav.lon === lon);
  }

  /**
   * Toggle favorite status
   * @param {Object} location
   * @returns {Promise<boolean>} - true if added, false if removed
   */
  async function toggleFavorite(location) {
    if (isFavorited(location.lat, location.lon)) {
      await removeFavorite(location.lat, location.lon);
      return false;
    } else {
      await addFavorite(location);
      return true;
    }
  }

  /**
   * Clear all favorites
   */
  async function clearAllFavorites() {
    favorites.value = [];
    await saveFavorites();
  }

  /**
   * Set filter query
   * @param {string} query
   */
  function setFilterQuery(query) {
    filterQuery.value = query;
  }

  return {
    // State
    favorites,
    filteredFavorites,
    isLoaded,
    count,
    filterQuery,

    // Actions
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorited,
    toggleFavorite,
    clearAllFavorites,
    setFilterQuery,
  };
});
