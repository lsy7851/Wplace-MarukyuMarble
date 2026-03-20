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
import { ref, computed, watch, onMounted } from 'vue';
import { useLocationFavoritesStore } from '@/stores/locationFavoritesStore.js';
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';
import { useNavigation } from '@/composables/ui/useNavigation.js';
import LocationFavoriteItem from '@/components/location-search/LocationFavoriteItem.vue';

const favoritesStore = useLocationFavoritesStore();
const locationSearchStore = useLocationSearchStore();
const { navigateToLocation } = useNavigation();

const isCollapsed = ref(false);

// Auto-collapse when searching
watch(() => locationSearchStore.query, (newQuery) => {
  if (newQuery && newQuery.trim().length > 0) {
    // Collapse when user types search query
    isCollapsed.value = true;
  } else {
    // Expand when search is cleared
    isCollapsed.value = false;
  }
});

const favorites = computed(() => favoritesStore.filteredFavorites);
const count = computed(() => favoritesStore.count);
const filterQuery = computed({
  get: () => favoritesStore.filterQuery,
  set: (value) => favoritesStore.setFilterQuery(value),
});

// Load favorites on mount
onMounted(async () => {
  if (!favoritesStore.isLoaded) {
    await favoritesStore.loadFavorites();
  }
});

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

async function handleClearAll() {
  if (confirm('Are you sure you want to clear all favorites?')) {
    await favoritesStore.clearAllFavorites();
  }
}

function handleLocationClick(location) {
  navigateToLocation(parseFloat(location.lat), parseFloat(location.lon));
}

async function handleRemove(location) {
  await favoritesStore.removeFavorite(location.lat, location.lon);
}
</script>

<template>
  <div v-if="count > 0" class="mt-4 border-t border-white/10 pt-3">
    <!-- Header -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex cursor-pointer select-none items-center gap-2 font-semibold hover:text-mm-text-muted" @click="toggleCollapse">
        <span class="text-xs transition-transform duration-200 ease-in-out" :class="{ '-rotate-90': isCollapsed }">▼</span>
        <span>⭐ Favorites</span>
        <span class="rounded-xl bg-mm-blue/30 px-2 py-0.5 text-xs font-semibold text-blue-300">{{ count }}</span>
      </div>
      <button
        class="cursor-pointer rounded-md border border-mm-bg-muted bg-mm-bg-border px-3 py-1.5 font-mono text-xs text-mm-text-primary transition-all duration-[180ms] ease-in-out hover:border-mm-error-dark hover:bg-mm-error-dark"
        @click="handleClearAll">
        Clear All
      </button>
    </div>

    <!-- Filter Input -->
    <input
      v-if="!isCollapsed"
      v-model="filterQuery"
      type="text"
      class="favorites-filter mb-3 w-full rounded-lg border border-mm-bg-muted bg-mm-bg-darkest/50 px-3 py-2 font-mono text-[13px] text-mm-text-primary transition-all duration-200 ease-in-out focus:border-mm-blue focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] focus:outline-none"
      placeholder="Filter favorites..." />

    <!-- Favorites List -->
    <div v-if="!isCollapsed" class="favorites-list flex max-h-[300px] flex-col gap-2 overflow-y-auto">
      <div v-if="favorites.length === 0" class="p-4 text-center text-[13px] text-mm-text-secondary">
        No favorites match your filter
      </div>
      <LocationFavoriteItem
        v-for="(favorite, index) in favorites"
        :key="index"
        :location="favorite"
        :show-favorite="false"
        :show-remove="true"
        @click="handleLocationClick"
        @remove="handleRemove" />
    </div>
  </div>
</template>

<style scoped>
.favorites-filter::placeholder {
  color: #64748b;
}

.favorites-list::-webkit-scrollbar {
  width: 6px;
}

.favorites-list::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 6px;
}

.favorites-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 6px;
}
</style>
