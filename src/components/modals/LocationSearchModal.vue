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
        <button
          class="cursor-pointer rounded-lg border border-mm-bg-muted bg-mm-bg-border px-3 py-2 font-mono text-[13px] text-mm-text-primary transition-all duration-[180ms] ease-in-out hover:-translate-y-px hover:bg-mm-bg-muted active:translate-y-0 active:bg-mm-bg-border"
          @click="openAddLocationModal">
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
