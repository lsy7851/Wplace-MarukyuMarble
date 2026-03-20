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
import { useImageProcessing } from '@/composables/features/useImageProcessing';
import { useTileCache } from '@/composables/storage/useTileCache';
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
  <div id="bm-contain-buttons-template"
    class="grid grid-cols-3 grid-rows-[auto_auto_auto_auto] items-stretch gap-1 mt-2"
    :class="{ 'is-minimized': minimized }">
    <!-- Upload Template Button (Row 1 - spans all 3 columns) -->
    <div class="col-span-3 row-start-1">
      <button
        class="btn-base w-full h-full whitespace-nowrap overflow-hidden text-ellipsis box-border"
        @click="handleUploadClick"
        v-if="!minimized">
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
        class="!hidden !invisible !absolute !-left-[9999px] !-top-[9999px] !w-0 !h-0 !opacity-0 !-z-[9999] !pointer-events-none"
        @change="handleFileChange"
      />
    </div>

    <!-- Row 2: Create, Manage, Pause Tiles buttons -->
    <button id="bm-button-create"
      class="btn-base row-start-2 col-start-1"
      @click="handleCreate" v-if="!minimized">
      <span v-html="icons.createIcon"></span>
      Create
    </button>
    <button id="bm-button-manage"
      class="btn-base row-start-2 col-start-2"
      @click="handleManage" v-if="!minimized">
      <span v-html="icons.manageIcon"></span>
      Manage
    </button>
    <button
      id="bm-button-pause-tiles"
      class="btn-pause row-start-2 col-start-3"
      @click="handlePause"
      :class="{paused: isPaused}"
      v-if="!minimized">
      <span v-html="icons.pauseIcon"></span>
      Pause
    </button>

    <!-- Row 3: Color Filter button (spans all 3 columns) -->
    <button
      id="bm-button-color-filter"
      class="btn-base col-span-3 font-bold relative overflow-hidden w-full animate-[colorShift_3s_ease-in-out_infinite] bg-[length:300%_300%]"
      :style="{ backgroundImage: 'linear-gradient(45deg, #475569, #6366f1, #8b5cf6, #3b82f6, #64748b, #475569)' }"
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
/* Base button styles */
.btn-base {
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

.btn-base:hover,
.btn-base:focus-visible {
  background-color: #3b9def;
}

.btn-base:active {
  background-color: #50a9f1;
}

/* SVG icon styling */
.btn-base span,
.btn-pause span {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

.btn-base span :deep(svg),
.btn-pause span :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

/* Color Filter hover */
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

/* Pause button */
.btn-pause {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .25rem;
  border-radius: .25rem;
  border: none;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  min-width: 0;
  background-color: #50a9f1 !important;
  transition: all 0.3s ease !important;
  font-size: 0.85rem;
  padding: .125rem .25rem;
}

.btn-pause:hover {
  background-color: #f57c00 !important;
  transform: translateY(-1px);
}

.btn-pause:active,
.btn-pause:focus-visible {
  background-color: #ef6c00 !important;
}

/* Pause button when paused (green state) */
.btn-pause.paused {
  background-color: #4CAF50 !important;
}

.btn-pause.paused:hover {
  background-color: #45a049 !important;
}

.btn-pause.paused:active,
.btn-pause.paused:focus-visible {
  background-color: #3d8b40 !important;
}

/* Minimized State */
#bm-contain-buttons-template.is-minimized {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  margin-top: 12px;
  display: block;
  z-index: 9002;
}

#bm-button-color-filter.minimized {
  width: 56px !important;
  height: 38px !important;
  padding: 0 !important;
  margin: 0 !important;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6) !important;
  animation: none !important;
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
