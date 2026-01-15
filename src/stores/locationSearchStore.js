/**
 * Location Search Store - Manages location search state and modal visibility
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { searchLocation, parseNominatimResult } from '@/utils/nominatim.js';

// Debounce timeout
let searchTimeout = null;
const DEBOUNCE_DELAY = 500; // ms

export const useLocationSearchStore = defineStore('locationSearch', () => {
  // Modal visibility
  const isOpen = ref(false);

  // Search state
  const query = ref('');
  const results = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Computed
  const hasResults = computed(() => results.value.length > 0);
  const hasQuery = computed(() => query.value.trim().length > 0);

  /**
   * Open location search modal
   */
  function open() {
    isOpen.value = true;
  }

  /**
   * Close location search modal
   */
  function close() {
    isOpen.value = false;
  }

  /**
   * Toggle location search modal
   */
  function toggle() {
    isOpen.value = !isOpen.value;
  }

  /**
   * Set search query
   * @param {string} newQuery
   */
  function setQuery(newQuery) {
    query.value = newQuery;
  }

  /**
   * Set search results
   * @param {Array} newResults
   */
  function setResults(newResults) {
    results.value = newResults;
    error.value = null;
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  function setLoading(loading) {
    isLoading.value = loading;
  }

  /**
   * Set error
   * @param {Error|string} err
   */
  function setError(err) {
    error.value = err;
    isLoading.value = false;
  }

  /**
   * Clear search results
   */
  function clearResults() {
    results.value = [];
    error.value = null;
  }

  /**
   * Clear search query and results
   */
  function clearAll() {
    query.value = '';
    results.value = [];
    error.value = null;
    isLoading.value = false;
  }

  /**
   * Perform location search
   * @param {string} searchQuery - Search query
   */
  async function search(searchQuery) {
    // Clear previous results if query is empty
    if (!searchQuery || !searchQuery.trim()) {
      clearResults();
      return;
    }

    query.value = searchQuery;
    isLoading.value = true;
    error.value = null;

    try {
      const apiResults = await searchLocation(searchQuery, { limit: 5 });

      // Parse results into standardized format and normalize lat/lng naming
      const parsedResults = apiResults.map(result => {
        const parsed = parseNominatimResult(result);
        // Nominatim uses 'lon' but we use 'lng' consistently
        return {
          ...parsed,
          lng: parsed.lon || parsed.lng,
        };
      });

      results.value = parsedResults;
      error.value = null;

    } catch (err) {
      error.value = err.message || 'Search failed';
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Perform debounced search
   * @param {string} searchQuery - Search query
   */
  function debouncedSearch(searchQuery) {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Clear results immediately if query is empty
    if (!searchQuery || !searchQuery.trim()) {
      clearResults();
      query.value = '';
      return;
    }

    // Set query immediately for UI feedback
    query.value = searchQuery;

    // Debounce actual search
    searchTimeout = setTimeout(() => {
      search(searchQuery);
    }, DEBOUNCE_DELAY);
  }

  return {
    // Modal state
    isOpen,
    open,
    close,
    toggle,

    // Search state
    query,
    results,
    isLoading,
    error,
    hasResults,
    hasQuery,

    // Actions
    search,
    debouncedSearch,
    clearResults,
    clearAll,
  };
});
