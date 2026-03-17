<script setup>
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
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';
import { useLocationFavoritesStore } from '@/stores/locationFavoritesStore.js';
import { useNavigation } from '@/composables/ui/useNavigation.js';
import LocationItem from './LocationItem.vue';

const locationSearchStore = useLocationSearchStore();
const favoritesStore = useLocationFavoritesStore();
const { navigateToLocation } = useNavigation();

const results = computed(() => locationSearchStore.results);
const isLoading = computed(() => locationSearchStore.isLoading);
const error = computed(() => locationSearchStore.error);
const hasQuery = computed(() => locationSearchStore.hasQuery);
const hasResults = computed(() => locationSearchStore.hasResults);

function handleLocationClick(location) {
  navigateToLocation(parseFloat(location.lat), parseFloat(location.lon));
}

async function handleToggleFavorite(location) {
  await favoritesStore.toggleFavorite(location);
}

function isFavorited(location) {
  return favoritesStore.isFavorited(location.lat, location.lon);
}
</script>

<template>
  <div class="search-results">
    <!-- Loading -->
    <div v-if="isLoading" class="result-state loading">
      Searching...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="result-state error">
      {{ error }}
    </div>

    <!-- No results -->
    <div v-else-if="hasQuery && !hasResults" class="result-state empty">
      No results found
    </div>

    <!-- Results list -->
    <div v-else-if="hasResults" class="results-list">
      <LocationItem
        v-for="(result, index) in results"
        :key="index"
        :location="result"
        :is-favorited="isFavorited(result)"
        @click="handleLocationClick"
        @toggle-favorite="handleToggleFavorite" />
    </div>
  </div>
</template>

<style scoped>
.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.search-results::-webkit-scrollbar {
  width: 8px;
}

.search-results::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 8px;
}

.search-results::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 8px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}

.result-state {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.result-state.loading {
  color: #3b82f6;
}

.result-state.error {
  color: #ef4444;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: hidden;
}
</style>
