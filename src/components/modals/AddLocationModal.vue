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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

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
    <div class="add-location-form">
      <!-- Name Input -->
      <div class="form-group">
        <label for="location-name">Name:</label>
        <input
          id="location-name"
          v-model="locationName"
          type="text"
          placeholder="e.g., My House, My Art, Work" />
      </div>

      <!-- Link Input -->
      <div class="form-group">
        <label for="location-link">Paste wplace.live link:</label>
        <input
          id="location-link"
          v-model="locationLink"
          type="text"
          placeholder="https://wplace.live/?lat=-19.037&lng=-42.420&zoom=16" />
      </div>

      <!-- Coordinates (read-only) -->
      <div class="form-group coords-group">
        <div class="coord-input">
          <label for="location-lat">Latitude:</label>
          <input
            id="location-lat"
            v-model="locationLat"
            type="text"
            :class="{ valid: linkStatus === 'valid', invalid: linkStatus === 'invalid' }"
            placeholder="e.g., -23.5506507"
            readonly />
        </div>
        <div class="coord-input">
          <label for="location-lon">Longitude:</label>
          <input
            id="location-lon"
            v-model="locationLon"
            type="text"
            :class="{ valid: linkStatus === 'valid', invalid: linkStatus === 'invalid' }"
            placeholder="e.g., -46.6333824"
            readonly />
        </div>
      </div>

      <!-- Buttons -->
      <div class="button-group">
        <button class="btn-secondary" @click="handleCancel">
          Cancel
        </button>
        <button class="btn-primary" @click="handleSave">
          Save to Favorites
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.add-location-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

.form-group input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background: rgba(15, 23, 42, 0.5);
  color: #f1f5f9;
  font: 14px monospace;
  transition: all 0.2s ease;
}

.form-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  outline: none;
}

.form-group input::placeholder {
  color: #64748b;
}

.form-group input[readonly] {
  background: rgba(15, 23, 42, 0.3);
  cursor: not-allowed;
}

.form-group input.valid {
  border-color: #22c55e;
  color: #4ade80;
}

.form-group input.invalid {
  border-color: #ef4444;
  color: #f87171;
}

.coords-group {
  flex-direction: row;
  gap: 12px;
}

.coord-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font: 14px monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.btn-secondary {
  background: #334155;
  color: #f1f5f9;
  border: 1px solid #475569;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:active {
  background: #1d4ed8;
}
</style>
