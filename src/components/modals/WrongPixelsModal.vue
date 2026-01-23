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
      <span class="wrong-pixels-title">
        Wrong Pixels
        <span v-if="wrongPixelsList.length > 0" class="wrong-count">
          ({{ wrongPixelsList.length }} locations)
        </span>
      </span>
    </template>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wrong pixels...</p>
    </div>

    <!-- No data state -->
    <div v-else-if="!hasTemplateData" class="empty-state">
      <p class="empty-icon">📋</p>
      <p class="empty-text">No tile data available.</p>
      <p class="empty-hint">Please load a template first!</p>
    </div>

    <!-- No wrong pixels found -->
    <div v-else-if="wrongPixelsList.length === 0" class="success-state">
      <p class="success-icon">🎉</p>
      <p class="success-text">No wrong pixels found!</p>
      <p class="success-hint">All pixels match the template.</p>
    </div>

    <!-- Wrong pixels list -->
    <div v-else class="wrong-pixels-content">
      <div class="wrong-pixels-list">
        <div
          v-for="(pixel, index) in wrongPixelsList"
          :key="`${pixel.tileX}-${pixel.tileY}-${pixel.colorKey}-${index}`"
          class="wrong-pixel-item"
          @click="flyToPixel(pixel)">
          <!-- Color swatch -->
          <div
            class="color-swatch"
            :style="{ background: `rgb(${pixel.colorKey})` }">
          </div>

          <!-- Info section -->
          <div class="pixel-info">
            <div class="tile-coords">
              Tile {{ pixel.tileX }}, {{ pixel.tileY }}
              <span v-if="pixel.pixelX === 0 && pixel.pixelY === 0" class="approx-badge">(approx)</span>
            </div>
            <div class="pixel-details">
              {{ pixel.wrongCount }} wrong pixel{{ pixel.wrongCount > 1 ? 's' : '' }}
              • RGB({{ pixel.colorKey }})
              <span v-if="pixel.colorName" class="color-name">• {{ pixel.colorName }}</span>
            </div>
          </div>

          <!-- Fly button -->
          <button
            class="fly-btn"
            title="Fly to this location"
            @click.stop="flyToPixel(pixel)">
            ✈️
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="modal-footer">
        <span v-if="wrongPixelsList.length > 0" class="footer-hint">
          Click any item to fly to that location
        </span>
        <button class="btn btn-secondary" @click="handleClose">
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
import { useNavigation } from '@/composables/useNavigation.js';
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
/* Title */
.wrong-pixels-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wrong-count {
  font-size: 14px;
  font-weight: 500;
  color: #f87171;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15));
  padding: 2px 8px;
  border-radius: 4px;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #94a3b8;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-icon,
.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text,
.success-text {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 8px 0;
}

.empty-hint,
.success-hint {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

/* Wrong pixels list */
.wrong-pixels-content {
  max-height: 400px;
  overflow-y: auto;
}

.wrong-pixels-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wrong-pixel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.3), rgba(51, 65, 85, 0.2));
  border: 1px solid #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wrong-pixel-item:hover {
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.5), rgba(51, 65, 85, 0.4));
  border-color: #64748b;
  transform: translateY(-1px);
}

/* Color swatch */
.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

/* Pixel info */
.pixel-info {
  flex: 1;
  min-width: 0;
}

.tile-coords {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 14px;
  margin-bottom: 2px;
}

.approx-badge {
  font-size: 10px;
  font-weight: 400;
  color: #fbbf24;
  margin-left: 4px;
}

.pixel-details {
  font-size: 12px;
  color: #94a3b8;
}

.color-name {
  color: #cbd5e1;
}

/* Fly button */
.fly-btn {
  padding: 8px 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.fly-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: scale(1.05);
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-hint {
  font-size: 12px;
  color: #94a3b8;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}

.btn-secondary {
  background: linear-gradient(135deg, #475569, #334155);
  color: #f1f5f9;
  border: 1px solid #64748b;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #64748b, #475569);
  transform: translateY(-1px);
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
