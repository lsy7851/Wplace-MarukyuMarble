<script setup>
import { ref, computed } from 'vue';
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';
import BaseModal from './BaseModal.vue';
import AddLocationModal from './AddLocationModal.vue';
import LocationSearchInput from '../location-search/LocationSearchInput.vue';
import LocationSearchResults from '../location-search/LocationSearchResults.vue';
import LocationFavoritesList from '../location-search/LocationFavoritesList.vue';

const locationSearchStore = useLocationSearchStore();

const isOpen = computed({
  get: () => locationSearchStore.isOpen,
  set: (value) => {
    if (value) {
      locationSearchStore.open();
    } else {
      locationSearchStore.close();
    }
  },
});

const isAddLocationModalOpen = ref(false);

function openAddLocationModal() {
  isAddLocationModalOpen.value = true;
}

function closeAddLocationModal() {
  isAddLocationModalOpen.value = false;
}

function handleClose() {
  locationSearchStore.close();
}
</script>

<template>
  <div>
    <!-- Main Search Modal -->
    <BaseModal
      v-model="isOpen"
      title="🔍 Location Search"
      @close="handleClose">
      <!-- Header Actions -->
      <template #actions>
        <button class="btn-location" @click="openAddLocationModal">
          Location
        </button>
      </template>

      <!-- Search Input -->
      <LocationSearchInput />

      <!-- Search Results -->
      <LocationSearchResults />

      <!-- Favorites List -->
      <LocationFavoritesList />
    </BaseModal>

    <!-- Add Location Modal -->
    <AddLocationModal
      v-model="isAddLocationModalOpen"
      @close="closeAddLocationModal" />
  </div>
</template>

<style scoped>
.btn-location {
  border: 1px solid #475569;
  padding: 8px 12px;
  border-radius: 8px;
  background: #334155;
  color: #f1f5f9;
  font: 13px monospace;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-location:hover {
  background: #475569;
  transform: translateY(-1px);
}

.btn-location:active {
  background: #334155;
  transform: translateY(0px);
}
</style>
