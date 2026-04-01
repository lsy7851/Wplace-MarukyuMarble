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
import { defineProps } from 'vue';
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';
import { useCoordinateStore } from '@/stores/coordinateStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useColorFilterStore } from '@/stores/colorFilterStore.js';
import { useStatusStore } from '@/stores/statusStore.js';
import { useNavigation } from '@/composables/ui/useNavigation.js';
import { useImportExport } from '@/composables/features/useImportExport.js';
import { tileToLatLng } from '@/utils/coordinates.js';
import { storeToRefs } from 'pinia';
import { useTemplateStore } from '@/stores/templateStore';
import { useScreenshot } from '@/composables/features/useScreenshot';
import { useIndexedDB } from '@/composables/storage/useIndexedDB';
import IconButton from '@/components/common/IconButton.vue';

const props = defineProps({
  icons: {
    type: Object,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
});

const locationSearchStore = useLocationSearchStore();
const coordinateStore = useCoordinateStore();
const settingsStoreInstance = useSettingsStore();
const statusStore = useStatusStore();
const { errorMapEnabled } = storeToRefs(settingsStoreInstance);
const { navigateToLocation } = useNavigation();
const { importFromFile } = useImportExport();

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
    statusStore.handleDisplayError('Coordinates are malformed!');
    return;
  }

  try {
    // Convert tile/pixel coordinates to lat/lng
    const { lat, lng } = tileToLatLng(
      coords.tileX,
      coords.tileY,
      coords.pixelX,
      coords.pixelY,
    );

    // Navigate to the location using settings-based navigation method
    await navigateToLocation(lat, lng, 13.62);
  } catch (error) {
    statusStore.handleDisplayError(`Failed to navigate: ${error.message}`);
  }
};

const { takeTemplateScreenshot } = useScreenshot();

const handleScreenshot = async () => {
  const templateStore = useTemplateStore();

  try {
    // SMART DETECTION: Get currently displayed template or first enabled template
    let t = null;

    // 1. Check actively displayed templates (if we had tracking for "currently displayed" - for now check enabled)
    // Legacy code had `currentlyDisplayedTemplates` set. In new architecture, we might check `templateStore.templates`
    // and see which ones are enabled.

    // For now, let's look for the first enabled template
    const enabledTemplates = templateStore.templates.filter(tpl => tpl.enabled);

    if (enabledTemplates.length === 1) {
      t = enabledTemplates[0];
    } else if (enabledTemplates.length > 0) {
      // If multiple enabled, pick the first one (or ideally the one under cursor if we could detect)
      t = enabledTemplates[0];
    }

    // Fallback: Use first template if none enabled
    if (!t && templateStore.templates.length > 0) {
      t = templateStore.templates[0];
    }

    if (!t) {
      statusStore.handleDisplayError('No template loaded.');
      return;
    }

    // Check for coordinates
    if (!t.coords || t.coords.length !== 4) {
      statusStore.handleDisplayError('Template coordinates not available.');
      return;
    }

    const [ tx, ty, px, py ] = t.coords;
    const width = t.imageWidth || t.width || 1000; // Fallback width
    const height = t.imageHeight || t.height || 1000; // Fallback height

    const blob = await takeTemplateScreenshot(t);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `wplace_template_area_${String(tx).padStart(4, '0')},${String(ty).padStart(4, '0')}_${ts}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    statusStore.handleDisplayError(`Failed to create screenshot: ${e.message}`);
  }
};

const handleClearStorage = async () => {
  if (confirm('Clear All Extension Storage?\n\nThis will delete ONLY this extension\'s data:\n• Templates\n• Settings\n• Color filters\n• Cached tiles\n\nOther wplace settings will NOT be affected.\n\nAre you sure?')) {
    try {
      const db = useIndexedDB();
      const settingsStore = useSettingsStore();
      const colorFilterStore = useColorFilterStore();

      // 1. Clear IndexedDB (Tiles)
      await db.clearAllTiles();

      // 2. Clear chrome.storage.sync (Metadata/Settings)
      await chrome.storage.sync.clear();

      // 3. Reset Pinia stores to defaults
      await settingsStore.resetSettings();
      await colorFilterStore.resetSettings();

      // 4. Clear localStorage (Legacy keys cleanup) - TARGETED CLEAR ONLY
      // Most settings are now in chrome.storage.sync, but we still clean up legacy keys
      // DO NOT USE localStorage.clear() as it wipes other extensions/wplace data!
      let deletedCount = 0;
      const keysToRemove = [];

      // Identify keys to remove (Standardized 'mm' prefix)
      // Legacy 'bm' keys are also removed just in case of stale data from previous versions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && (
          // Standardized mm keys (camelCase)
          key.startsWith('mm') ||
          // Legacy keys cleanup (bm prefix)
          key.startsWith('bm') ||
          // Safety catch for any old migration stragglers (though specific ones preferred)
          key.startsWith('compactSort') || // Old key cleanup
          key.startsWith('tile-cache')     // Old key cleanup
        )) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        deletedCount++;
      });

      // 5. Clear sessionStorage (Session data) - TARGETED CLEAR ONLY
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('mm') || key.startsWith('bm') || key.toLowerCase().includes('bluemarble'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

      statusStore.handleDisplayStatus('🧹 Storage cleared!');
      setTimeout(() => window.location.reload(), 500);

    } catch (e) {
      statusStore.handleDisplayError('Failed to clear storage.');
    }
  }
};

const handleImport = () => {
  // Create hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await importFromFile(file);
      statusStore.handleDisplayStatus(`✅ Import Complete! Imported: ${result.imported} template(s), Skipped: ${result.skipped}`);
    } catch (error) {
      statusStore.handleDisplayError(`Import failed: ${error.message}`);
    }
  };

  input.click();
};

const emit = defineEmits([ 'open-settings', 'open-wrong-pixels', 'toggle-error-map' ]);

const handleSettings = () => {
  emit('open-settings');
};

const handleWrongPixels = () => {
  emit('open-wrong-pixels');
};

const handleErrorMapToggle = async () => {
  const newState = await settingsStoreInstance.toggleErrorMapMode();
  emit('toggle-error-map', newState);

  // Status message for error map toggle
  if (newState) {
    statusStore.handleDisplayStatus('🗺️ Error Map enabled! Green=correct, Red=wrong pixels');
  } else {
    statusStore.handleDisplayStatus('🗺️ Error Map disabled');
  }
};
</script>

<template>
  <div id="bm-contain-buttons-action" class="flex justify-between mt-2">
    <div class="flex gap-1.5 items-center">
      <IconButton
        id="bm-button-convert"
        title="Template Color Converter"
        @click="handleColorConverter"
      >🎨</IconButton>

      <IconButton
        id="bm-search"
        title="Location Search"
        @click="handleSearch"
      >🔍</IconButton>

      <IconButton
        id="bm-button-flyto"
        title="Fly to current coordinates"
        @click="handleFlyTo"
      >🗺️</IconButton>

      <IconButton
        id="bm-button-screenshot"
        title="Screenshot current template area (auto-detects coordinates)"
        @click="handleScreenshot"
      >📸</IconButton>

      <IconButton
        id="bm-button-wrong-pixels"
        title="View Wrong Pixels Coordinates"
        @click="handleWrongPixels"
      >❌</IconButton>

      <IconButton
        id="bm-button-error-map"
        title="Error Map View (Green=correct, Red=wrong)"
        :active="errorMapEnabled"
        active-class="bg-linear-to-br from-mm-success to-mm-success-dark! border-mm-success-dark! text-white! hover:from-mm-success-dark hover:to-mm-success-darker"
        @click="handleErrorMapToggle"
      >🗺️</IconButton>

      <IconButton
        id="bm-button-clear-storage"
        title="Clear All Storage"
        @click="handleClearStorage"
        v-html="icons.clearStorageIcon"
      />

      <IconButton
        id="bm-button-import"
        title="Import Templates"
        @click="handleImport"
        v-html="icons.uploadIcon"
      />

      <IconButton
        id="bm-button-settings-direct"
        title="Settings (Quick Access)"
        @click="handleSettings"
        v-html="icons.settingsIcon"
      />
    </div>

    <!-- Footer -->
    <div
      class="absolute left-0 bottom-0.5 text-left p-0 pointer-events-auto select-text leading-3">
      <small class="text-mm-text-secondary text-[0.74em] opacity-85">
        Made by SwingTheVine, Seris0 | Fork lsy7851 | v{{ version }}
      </small>
    </div>
  </div>
</template>
