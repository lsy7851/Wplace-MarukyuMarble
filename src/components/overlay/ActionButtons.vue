<script setup>
import { defineProps } from 'vue';

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

const handleColorConverter = () => {
  window.open('https://pepoafonso.github.io/color_converter_wplace/', '_blank', 'noopener noreferrer');
};

const handleSearch = () => {
  // TODO: Implement search panel toggle
  console.log('Search clicked');
};

const handleFlyTo = () => {
  // TODO: Implement fly-to coordinates
  console.log('Fly to clicked');
};

const handleScreenshot = () => {
  // TODO: Implement screenshot functionality
  console.log('Screenshot clicked');
};

const handleClearStorage = () => {
  // TODO: Implement clear storage dialog
  console.log('Clear storage clicked');
};

const handleImport = () => {
  // TODO: Implement import dialog
  console.log('Import clicked');
};

const handleSettings = () => {
  // TODO: Implement settings overlay
  console.log('Settings clicked');
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
