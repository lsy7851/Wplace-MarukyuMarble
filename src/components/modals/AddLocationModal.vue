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
import { ref, watch } from 'vue';
import { useLocationFavoritesStore } from '@/stores/locationFavoritesStore.js';
import { parseWplaceUrl } from '@/utils/coordinates.js';
import BaseModal from './BaseModal.vue';
import BaseInput from '@/components/common/BaseInput.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([ 'update:modelValue' ]);

const favoritesStore = useLocationFavoritesStore();

const locationName = ref('');
const locationLink = ref('');
const locationLat = ref('');
const locationLon = ref('');
const linkStatus = ref(''); // 'valid', 'invalid', or ''

// Watch link input and parse coordinates
watch(locationLink, (link) => {
  if (!link.trim()) {
    locationLat.value = '';
    locationLon.value = '';
    linkStatus.value = '';
    return;
  }

  const parsed = parseWplaceUrl(link);

  if (parsed) {
    locationLat.value = String(parsed.lat);
    locationLon.value = String(parsed.lng);
    linkStatus.value = 'valid';
  } else {
    locationLat.value = '';
    locationLon.value = '';
    linkStatus.value = 'invalid';
  }
});

function close() {
  emit('update:modelValue', false);
}

function resetForm() {
  locationName.value = '';
  locationLink.value = '';
  locationLat.value = '';
  locationLon.value = '';
  linkStatus.value = '';
}

function handleCancel() {
  resetForm();
  close();
}

async function handleSave() {
  const name = locationName.value.trim();
  const lat = locationLat.value.trim();
  const lon = locationLon.value.trim();

  if (!name || !lat || !lon) {
    alert('Please fill all fields');
    return;
  }

  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
    alert('Please enter valid coordinates');
    return;
  }

  const locationData = {
    lat: lat,
    lon: lon,
    primaryName: name,
    secondaryInfo: `Custom Location (${lat}, ${lon})`,
    fullAddress: '',
  };

  await favoritesStore.addFavorite(locationData);
  resetForm();
  close();
}

// Reset form when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Add Custom Location"
    @update:model-value="emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4">
      <!-- Name Input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-mm-text-muted" for="location-name">Name:</label>
        <BaseInput
          id="location-name"
          v-model="locationName"
          placeholder="e.g., My House, My Art, Work" />
      </div>

      <!-- Link Input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-mm-text-muted" for="location-link">Paste wplace.live link:</label>
        <BaseInput
          id="location-link"
          v-model="locationLink"
          placeholder="https://wplace.live/?lat=-19.037&lng=-42.420&zoom=16" />
      </div>

      <!-- Coordinates (read-only) -->
      <div class="flex flex-row gap-3">
        <div class="flex-1 flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-mm-text-muted" for="location-lat">Latitude:</label>
          <BaseInput
            id="location-lat"
            v-model="locationLat"
            :class="{ 'border-green-500! text-green-400!': linkStatus === 'valid', 'border-mm-error! text-red-400!': linkStatus === 'invalid' }"
            placeholder="e.g., -23.5506507"
            readonly />
        </div>
        <div class="flex-1 flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-mm-text-muted" for="location-lon">Longitude:</label>
          <BaseInput
            id="location-lon"
            v-model="locationLon"
            :class="{ 'border-green-500! text-green-400!': linkStatus === 'valid', 'border-mm-error! text-red-400!': linkStatus === 'invalid' }"
            placeholder="e.g., -46.6333824"
            readonly />
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex gap-3 justify-end mt-2">
        <button
          class="px-5 py-2.5 rounded-lg border-none font-mono text-sm cursor-pointer transition-all duration-200 ease-in-out font-semibold bg-mm-bg-border text-mm-text-primary border border-mm-bg-muted hover:bg-mm-bg-muted"
          @click="handleCancel">
          Cancel
        </button>
        <button
          class="px-5 py-2.5 rounded-lg border-none font-mono text-sm cursor-pointer transition-all duration-200 ease-in-out font-semibold bg-mm-blue text-white hover:bg-mm-blue-dark active:bg-mm-blue-darker"
          @click="handleSave">
          Save to Favorites
        </button>
      </div>
    </div>
  </BaseModal>
</template>
