<script setup>
import { defineProps } from 'vue';
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';
import { useCoordinateStore } from '@/stores/coordinateStore.js';
import { useNavigation } from '@/composables/useNavigation.js';
import { tileToLatLng } from '@/utils/coordinates.js';

const props = defineProps({
  icons: {
    type: Object,
    required: true
  },
  version: {
    type: String,
    required: true
  }
});

const locationSearchStore = useLocationSearchStore();
const coordinateStore = useCoordinateStore();
const { navigateToLocation } = useNavigation();

const handleColorConverter = () => {
  window.open('https://pepoafonso.github.io/color_converter_wplace/', '_blank', 'noopener noreferrer');
};

const handleSearch = () => {
  locationSearchStore.toggle();
};

const handleFlyTo = async () => {
  // Get current coordinates from store
  const coords = coordinateStore.coordsObject;

  // Check if coordinates are available
  if (!coordinateStore.hasCoords) {
    alert('No coordinates detected. Please click on the canvas first.');
    return;
  }

  try {
    // Convert tile/pixel coordinates to lat/lng
    const { lat, lng } = tileToLatLng(
      coords.tileX,
      coords.tileY,
      coords.pixelX,
      coords.pixelY
    );

    // Navigate to the location using settings-based navigation method
    await navigateToLocation(lat, lng, 13.62);
  } catch (error) {
    console.error('❌ [ActionButtons] Failed to fly to coordinates:', error);
    alert(`Failed to navigate: ${error.message}`);
  }
};

const handleScreenshot = () => {
  // TODO: Implement screenshot functionality
};

const handleClearStorage = () => {
  // TODO: Implement clear storage dialog
};

const handleImport = () => {
  // TODO: Implement import dialog
};

const emit = defineEmits(['open-settings']);

const handleSettings = () => {
  emit('open-settings');
};
</script>

<template>
  <div id="bm-contain-buttons-action">
    <div style="display: flex; gap: 6px; align-items: center;">
      <button
        id="bm-button-convert"
        class="bm-help"
        title="Template Color Converter"
        @click="handleColorConverter"
      >🎨</button>

      <button
        id="bm-search"
        class="bm-help"
        title="Location Search"
        @click="handleSearch"
      >🔍</button>

      <button
        id="bm-button-flyto"
        class="bm-help"
        title="Fly to current coordinates"
        @click="handleFlyTo"
      >🗺️</button>

      <button
        id="bm-button-screenshot"
        class="bm-help"
        title="Screenshot current template area (auto-detects coordinates)"
        @click="handleScreenshot"
      >📸</button>

      <button
        id="bm-button-clear-storage"
        class="bm-help"
        title="Clear All Storage"
        @click="handleClearStorage"
        v-html="icons.clearStorageIcon"
      ></button>

      <button
        id="bm-button-import"
        class="bm-help"
        title="Import Templates"
        @click="handleImport"
        v-html="icons.uploadIcon"
      ></button>

      <button
        id="bm-button-settings-direct"
        class="bm-help"
        title="Settings (Quick Access)"
        @click="handleSettings"
        v-html="icons.settingsIcon"
      ></button>
    </div>

    <!-- Footer -->
    <div style="position: absolute; left: 0; bottom: 2px; text-align: left; padding: 0; pointer-events: auto; user-select: text; line-height: 12px;">
      <small style="color: #94a3b8; font-size: 0.74em; opacity: 0.85;">
        Made by SwingTheVine, Seris0 | Fork lsy7851 | v{{ version }}
      </small>
    </div>
  </div>
</template>

<style scoped>
/* The action buttons below the status textarea */
#bm-contain-buttons-action {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5em;
}

/* Base button styles */
#bm-contain-buttons-action button {
  border: none;
  border-radius: .25rem;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  background-color: #2190ED;
  transition: background-color 0.25s;
}

/* Question Mark button */
.bm-help {
  border: white 1px solid !important;
  height: 1.5em;
  width: 1.5em;
  margin-top: 2px;
  text-align: center;
  line-height: 1em;
  padding: 0 !important;
  background-color: #2190ED !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* FORÇA o botão Clear Storage a não herdar CSS do pause-tiles */
.bm-help {
  grid-row: unset !important;
  grid-column: unset !important;
  transform: none !important;
  transition: background-color 0.25s !important;
}

.bm-help:hover {
  background-color: #3b9def !important;
  transform: none !important;
}

.bm-help:active {
  background-color: #50a9f1 !important;
  transform: none !important;
}

/* SVG icon styling in buttons */
#bm-contain-buttons-action button :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}
</style>
