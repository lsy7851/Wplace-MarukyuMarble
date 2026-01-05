<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useLocationFavoritesStore } from '@/stores/locationFavoritesStore.js';
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';
import { useNavigation } from '@/composables/useNavigation.js';
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
  <div v-if="count > 0" class="favorites-section">
    <!-- Header -->
    <div class="favorites-header">
      <div class="favorites-title" @click="toggleCollapse">
        <span class="toggle-icon" :class="{ collapsed: isCollapsed }">▼</span>
        <span>⭐ Favorites</span>
        <span class="favorites-count">{{ count }}</span>
      </div>
      <button class="btn-clear" @click="handleClearAll">
        Clear All
      </button>
    </div>

    <!-- Filter Input -->
    <input
      v-if="!isCollapsed"
      v-model="filterQuery"
      type="text"
      class="favorites-filter"
      placeholder="Filter favorites..." />

    <!-- Favorites List -->
    <div v-if="!isCollapsed" class="favorites-list">
      <div v-if="favorites.length === 0" class="no-results">
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
.favorites-section {
  margin-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.favorites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.favorites-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.favorites-title:hover {
  color: #cbd5e1;
}

.toggle-icon {
  transition: transform 0.2s ease;
  font-size: 12px;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.favorites-count {
  background: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.btn-clear {
  border: 1px solid #475569;
  padding: 6px 12px;
  border-radius: 6px;
  background: #334155;
  color: #f1f5f9;
  font: 12px monospace;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-clear:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.favorites-filter {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background: rgba(15, 23, 42, 0.5);
  color: #f1f5f9;
  font: 13px monospace;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.favorites-filter:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  outline: none;
}

.favorites-filter::placeholder {
  color: #64748b;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
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

.no-results {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
</style>
