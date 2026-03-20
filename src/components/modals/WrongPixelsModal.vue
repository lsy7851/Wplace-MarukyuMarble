<template>
  <BaseModal
    v-model="isOpen"
    title="Wrong Pixels"
    :close-on-backdrop="true"
    :close-on-esc="true"
    :mobile-mode="mobileMode"
    @close="handleClose">
    <!-- Title with count -->
    <template #title>
      <span class="flex items-center gap-2">
        Wrong Pixels
        <span v-if="wrongPixelsList.length > 0" class="text-sm font-medium text-red-400 bg-linear-to-br from-mm-error/20 to-mm-error-dark/15 px-2 py-0.5 rounded">
          ({{ wrongPixelsList.length }} locations)
        </span>
      </span>
    </template>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 text-mm-text-secondary">
      <div class="loading-spinner w-8 h-8 border-3 border-white/10 border-t-mm-blue rounded-full mb-4"></div>
      <p>Loading wrong pixels...</p>
    </div>

    <!-- No data state -->
    <div v-else-if="!hasTemplateData" class="flex flex-col items-center justify-center p-10 text-center">
      <p class="text-[48px] mb-4">📋</p>
      <p class="text-base font-semibold text-mm-text-primary m-0 mb-2">No tile data available.</p>
      <p class="text-sm text-mm-text-secondary m-0">Please load a template first!</p>
    </div>

    <!-- No wrong pixels found -->
    <div v-else-if="wrongPixelsList.length === 0" class="flex flex-col items-center justify-center p-10 text-center">
      <p class="text-[48px] mb-4">🎉</p>
      <p class="text-base font-semibold text-mm-text-primary m-0 mb-2">No wrong pixels found!</p>
      <p class="text-sm text-mm-text-secondary m-0">All pixels match the template.</p>
    </div>

    <!-- Wrong pixels list -->
    <div v-else class="wrong-pixels-content max-h-100 overflow-y-auto">
      <div class="flex flex-col gap-2">
        <div
          v-for="(pixel, index) in wrongPixelsList"
          :key="`${pixel.tileX}-${pixel.tileY}-${pixel.colorKey}-${index}`"
          class="flex items-center gap-3 p-3 bg-linear-to-br from-mm-bg-muted/30 to-mm-bg-border/20 border border-mm-bg-muted rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:from-mm-bg-muted/50 hover:to-mm-bg-border/40 hover:border-mm-bg-light hover:-translate-y-px"
          @click="flyToPixel(pixel)">
          <!-- Color swatch -->
          <div
            class="w-6 h-6 rounded border-2 border-white/20 shrink-0"
            :style="{ background: `rgb(${pixel.colorKey})` }">
          </div>

          <!-- Info section -->
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-mm-text-primary text-sm mb-0.5">
              Tile {{ pixel.tileX }}, {{ pixel.tileY }}
              <span v-if="pixel.pixelX === 0 && pixel.pixelY === 0" class="text-[10px] font-normal text-mm-warning ml-1">(approx)</span>
            </div>
            <div class="text-xs text-mm-text-secondary">
              {{ pixel.wrongCount }} wrong pixel{{ pixel.wrongCount > 1 ? 's' : '' }}
              • RGB({{ pixel.colorKey }})
              <span v-if="pixel.colorName" class="text-mm-text-muted">• {{ pixel.colorName }}</span>
            </div>
          </div>

          <!-- Fly button -->
          <button
            class="px-3 py-2 bg-linear-to-br from-mm-blue to-mm-blue-dark border-none rounded-md text-white text-sm cursor-pointer transition-all duration-200 ease-in-out shrink-0 hover:from-mm-blue-dark hover:to-mm-blue-darker hover:scale-105"
            title="Fly to this location"
            @click.stop="flyToPixel(pixel)">
            ✈️
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <span v-if="wrongPixelsList.length > 0" class="text-xs text-mm-text-secondary">
          Click any item to fly to that location
        </span>
        <button
          class="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border-none font-inherit bg-linear-to-br from-mm-bg-muted to-mm-bg-border text-mm-text-primary border border-mm-bg-light hover:from-mm-bg-light hover:to-mm-bg-muted hover:-translate-y-px"
          @click="handleClose">
          Close
        </button>
      </div>
    </template>
  </BaseModal>
</template>

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
import { ref, computed, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useNavigation } from '@/composables/ui/useNavigation.js';
import { findColorByKey } from '@/utils/colorPalette.js';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mobileMode: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:modelValue', 'fly-to']);

// Store and composables
const templateStore = useTemplateStore();
const { flyToCoordinates } = useNavigation();

// Local state
const isLoading = ref(false);
const wrongPixelsList = ref([]);

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const hasTemplateData = computed(() => {
  return templateStore.tileProgress && templateStore.tileProgress.size > 0;
});

// Get color name from RGB key
function getColorName(colorKey) {
  const color = findColorByKey(colorKey);
  return color?.name || null;
}

// Load wrong pixels from tile progress
function loadWrongPixels() {
  isLoading.value = true;
  wrongPixelsList.value = [];

  try {
    const tileProgress = templateStore.tileProgress;

    if (!tileProgress || tileProgress.size === 0) {
      isLoading.value = false;
      return;
    }

    const list = [];

    for (const [tileCoords, tileData] of tileProgress.entries()) {
      // Check if tile has wrong pixels
      if (!tileData.wrong || tileData.wrong <= 0) continue;
      if (!tileData.colorBreakdown) continue;

      const [tileX, tileY] = tileCoords.split(',').map(Number);

      // Iterate through color breakdown to find wrong pixels
      for (const [colorKey, colorStats] of Object.entries(tileData.colorBreakdown)) {
        if (!colorStats.wrong || colorStats.wrong <= 0) continue;

        // Get first wrong pixel coordinates if available
        const firstWrongPixel = colorStats.firstWrongPixel || [0, 0];

        list.push({
          tileX,
          tileY,
          colorKey,
          colorName: getColorName(colorKey),
          wrongCount: colorStats.wrong,
          pixelX: firstWrongPixel[0],
          pixelY: firstWrongPixel[1],
        });
      }
    }

    // Sort by wrong count (descending)
    list.sort((a, b) => b.wrongCount - a.wrongCount);

    wrongPixelsList.value = list;
  } catch {
    // Ignore load errors
  } finally {
    isLoading.value = false;
  }
}

// Fly to wrong pixel location
async function flyToPixel(pixel) {
  try {
    const coords = [pixel.tileX, pixel.tileY, pixel.pixelX, pixel.pixelY];

    // Emit event for parent to handle status display
    emit('fly-to', {
      coords,
      pixel,
      message: `🧭 Flying to wrong pixel at Tile ${pixel.tileX},${pixel.tileY} (${pixel.pixelX}, ${pixel.pixelY})!`,
    });

    // Navigate to location
    await flyToCoordinates(coords, 19.5);

    // Close modal after navigation
    isOpen.value = false;
  } catch {
    // Ignore navigation errors
  }
}

// Handle close
function handleClose() {
  isOpen.value = false;
}

// Watch for modal open to load data
watch(isOpen, (newVal) => {
  if (newVal) {
    loadWrongPixels();
  }
});
</script>

<style scoped>
/* Loading spinner */
.loading-spinner {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Scrollbar */
.wrong-pixels-content::-webkit-scrollbar {
  width: 6px;
}

.wrong-pixels-content::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 3px;
}

.wrong-pixels-content::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

.wrong-pixels-content::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
