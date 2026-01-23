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
import { defineProps, ref } from 'vue';
import { useTemplateStore } from '@/stores/templateStore';
import { useUserStore } from '@/stores/userStore';
import { useCoordinateStore } from '@/stores/coordinateStore';
import { useStatusStore } from '@/stores/statusStore';
import { useImageProcessing } from '@/composables/useImageProcessing';
import { useTileCache } from '@/composables/useTileCache';
import { Template } from '@/models/Template';
import { numberToEncoded } from '@/utils/encoding';
import ManageTemplatesModal from '@/components/modals/ManageTemplatesModal.vue';
import ColorFilterModal from '@/components/modals/ColorFilterModal.vue';

const showColorFilterModal = ref(false);

const props = defineProps({
  icons: {
    type: Object,
    required: true,
  },
  minimized: Boolean,
});

const templateStore = useTemplateStore();
const userStore = useUserStore();
const coordinateStore = useCoordinateStore();
const statusStore = useStatusStore();
const { createTemplateTiles } = useImageProcessing();
const tileCache = useTileCache();

const fileInputRef = ref(null);
const isPaused = ref(false);
const selectedFile = ref(null);
const uploadFileName = ref('');
const showManageModal = ref(false);

const handleUploadClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    selectedFile.value = file;
    uploadFileName.value = file.name;
  }
};

const handleCreate = async () => {
  // Validate file selection
  if (!selectedFile.value) {
    statusStore.handleDisplayError('No file selected!');
    return;
  }

  // Validate coordinate input
  if (!coordinateStore.hasInputCoords) {
    statusStore.handleDisplayError('Coordinates are malformed!');
    return;
  }

  const file = selectedFile.value;
  const coords = coordinateStore.inputCoordsObject;

  // Additional validation: check if coordinates are valid numbers
  if (coords.tileX === null || coords.tileY === null || coords.pixelX === null || coords.pixelY === null) {
    statusStore.handleDisplayError('Please enter valid coordinates.');
    return;
  }

  // Validate coordinate ranges
  if (coords.tileX < 0 || coords.tileX > 2047 || coords.tileY < 0 || coords.tileY > 2047) {
    statusStore.handleDisplayError('Tile coordinates must be between 0 and 2047.');
    return;
  }

  if (coords.pixelX < 0 || coords.pixelX > 999 || coords.pixelY < 0 || coords.pixelY > 999) {
    statusStore.handleDisplayError('Pixel coordinates must be between 0 and 999.');
    return;
  }

  try {
    const result = await createTemplateTiles(file, [coords.tileX, coords.tileY, coords.pixelX, coords.pixelY]);

    const template = new Template({
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayName: file.name.replace(/\.[^/.]+$/, ''),
      sortID: templateStore.templates.length,
      authorID: numberToEncoded(userStore.userId || 0),
      coords: [coords.tileX, coords.tileY, coords.pixelX, coords.pixelY],
      enabled: true,
      pixelCount: result.pixelCount || 0,
      validPixelCount: result.validPixelCount || 0,
      transparentPixelCount: result.transparentPixelCount || 0,
      colorPalette: result.colorPalette || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await templateStore.addTemplate(template, result.tiles);
    const [tx, ty, px, py] = template.coords;
    statusStore.handleDisplayStatus(`✅ Template #${templateStore.templates.length} created at (${tx},${ty}) - ${template.validPixelCount} pixels`);

    selectedFile.value = null;
    uploadFileName.value = '';
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }

  } catch (error) {
    statusStore.handleDisplayError(`Failed to create template: ${error.message}`);
  }
};

const handleManage = () => {
  showManageModal.value = true;
};

const handlePause = () => {
  isPaused.value = tileCache.togglePause();
};

const handleColorFilter = () => {
  showColorFilterModal.value = !showColorFilterModal.value;
};
</script>

<template>
  <div id="bm-contain-buttons-template" :class="{ 'is-minimized': minimized }">
    <!-- Upload Template Button (Row 1 - spans all 3 columns) -->
    <div>
      <button @click="handleUploadClick" v-if="!minimized">
        <span v-html="icons.uploadIcon"></span>
        <template v-if="uploadFileName">
          {{ uploadFileName }}
        </template>
        <template v-else>
          Upload Template
        </template>
      </button>
      <input
        ref="fileInputRef"
        id="bm-input-file-template"
        type="file"
        accept="image/png, image/jpeg, image/webp, image/bmp, image/gif"
        @change="handleFileChange"
      />
    </div>

    <!-- Row 2: Create, Manage, Pause Tiles buttons -->
    <button id="bm-button-create" @click="handleCreate" v-if="!minimized">
      <span v-html="icons.createIcon"></span>
      Create
    </button>
    <button id="bm-button-manage" @click="handleManage" v-if="!minimized">
      <span v-html="icons.manageIcon"></span>
      Manage
    </button>
    <button
      id="bm-button-pause-tiles"
      @click="handlePause"
      :class="{paused: isPaused}"
      v-if="!minimized">
      <span v-html="icons.pauseIcon"></span>
      Pause
    </button>

    <!-- Row 3: Color Filter button (spans all 3 columns) -->
    <!-- Row 3: Color Filter button (spans all 3 columns) -->
    <button
      id="bm-button-color-filter"
      @click="handleColorFilter"
      :class="{ 'minimized': minimized }"
      :title="minimized ? 'Color Filter' : ''">
      <span v-html="icons.colorFilterIcon"></span>
      <span v-if="!minimized">Color Filter</span>
    </button>

    <!-- Color Filter Modal -->
    <ColorFilterModal
      v-model="showColorFilterModal"
      @close="showColorFilterModal = false" />

    <!-- Manage Templates Modal -->
    <ManageTemplatesModal v-model="showManageModal" />
  </div>
</template>

<style scoped>
/* Template buttons container - 3x4 grid layout */
#bm-contain-buttons-template {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto auto auto;
  align-items: stretch;
  gap: .25rem;
  margin-top: 0.5em;
}

/* Base button styles (inherited from Overlay.vue but need to be defined in scoped) */
#bm-contain-buttons-template button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .25rem;
  padding: .125rem .5rem;
  background-color: #2190ED;
  border-radius: .25rem;
  border: none;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: background-color 0.25s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

#bm-contain-buttons-template button:hover,
#bm-contain-buttons-template button:focus-visible {
  background-color: #3b9def;
}

#bm-contain-buttons-template button:active {
  background-color: #50a9f1;
}

/* SVG icon styling */
#bm-contain-buttons-template button span {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

#bm-contain-buttons-template button span :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

/* Row 1: Upload Template (spans all 3 columns - full width) */
div:has(> #bm-input-file-template) {
  grid-column: 1 / span 3;
  grid-row: 1;
}

/* Row 3: Color Filter (spans all 3 columns - full width) */
#bm-button-color-filter {
  grid-column: 1 / span 3;
  background: linear-gradient(45deg, #475569, #6366f1, #8b5cf6, #3b82f6, #64748b, #475569);
  background-size: 300% 300%;
  animation: colorShift 3s ease-in-out infinite;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  width: 100%;
}

#bm-button-color-filter:hover,
#bm-button-color-filter:focus-visible {
  animation-duration: 1s;
  transform: scale(1.05);
}

@keyframes colorShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

div:has(> #bm-input-file-template) > button {
  width: 100%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}

/* Force complete invisibility of file input to prevent native browser text */
#bm-input-file-template,
input[type="file"][id*="template"] {
  display: none !important;
  visibility: hidden !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  z-index: -9999 !important;
  pointer-events: none !important;
}

/* Row 2: Create, Manage, Pause Tiles buttons */
#bm-button-create {
  grid-row: 2;
  grid-column: 1;
}

#bm-button-manage {
  grid-row: 2;
  grid-column: 2;
}

#bm-button-pause-tiles {
  grid-row: 2;
  grid-column: 3;
  background-color: #50a9f1 !important;
  transition: all 0.3s ease !important;
  font-size: 0.85rem;
  padding: .125rem .25rem;
}

#bm-button-pause-tiles:hover {
  background-color: #f57c00 !important;
  transform: translateY(-1px);
}

#bm-button-pause-tiles:active,
#bm-button-pause-tiles:focus-visible {
  background-color: #ef6c00 !important;
}

/* Pause button when paused (green state) */
#bm-button-pause-tiles.paused {
  background-color: #4CAF50 !important;
}

#bm-button-pause-tiles.paused:hover {
  background-color: #45a049 !important;
}

#bm-button-pause-tiles.paused:active,
#bm-button-pause-tiles.paused:focus-visible {
  background-color: #3d8b40 !important;
}

/* Minimized State: Split Layout implementation */
#bm-contain-buttons-template.is-minimized {
  position: absolute;
  top: 100%; /* Position below the main overlay */
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  margin-top: 12px; /* Gap between square and button */
  display: block;
  z-index: 9002;
}

#bm-button-color-filter.minimized {
  width: 56px !important;
  height: 38px !important;
  padding: 0 !important;
  margin: 0 !important;
  
  /* Legacy Blue-Purple Gradient (Violet-500 to Blue-500 match) */
  background: linear-gradient(135deg, #8b5cf6, #3b82f6) !important;
  animation: none !important;
  
  /* Center icon */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  
  border-radius: 6px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
}

#bm-button-color-filter.minimized span:deep(svg) {
  width: 18px !important;
  height: 18px !important;
  margin: 0 !important;
  display: block !important;
}
</style>
