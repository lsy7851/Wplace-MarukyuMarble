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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useColorFilter } from '@/composables/features/useColorFilter.js';
import { useSettingsStore } from '@/stores/settingsStore.js';

// Props
const props = defineProps({
  minimized: Boolean,
});

const emit = defineEmits([ 'request-maximize' ]);

// Use color filter composable
const colorFilter = useColorFilter();

// Settings store
const settingsStore = useSettingsStore();

// Visibility from store
const showColorMenu = computed(() => settingsStore.showColorMenu);

// Mobile mode from store
const mobileMode = computed(() => settingsStore.mobileMode);

// Handle button click when minimized
function onMinimizedButtonClick() {
  emit('request-maximize');
}

// Resize state
const colorListRef = ref(null);
const isResizing = ref(false);
const startY = ref(0);
const startHeight = ref(0);

// Auto-update interval
let autoUpdateInterval = null;

// Helper to format numbers with locale
function formatNumber(num) {
  return num.toLocaleString();
}

// Resize handlers
function onResizeStart(event) {
  isResizing.value = true;
  startY.value = event.clientY || event.touches?.[0]?.clientY || 0;
  startHeight.value = colorListRef.value?.offsetHeight || settingsStore.colorMenuHeight;

  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';

  event.preventDefault();
  event.stopPropagation();
}

function onResizeMove(event) {
  if (!isResizing.value || !colorListRef.value) return;

  const clientY = event.clientY || event.touches?.[0]?.clientY || 0;
  const delta = clientY - startY.value;
  const newHeight = Math.max(60, Math.min(400, startHeight.value + delta));

  colorListRef.value.style.maxHeight = `${newHeight}px`;

  event.preventDefault();
  event.stopPropagation();
}

function onResizeEnd() {
  if (!isResizing.value) return;

  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  // Save height to store
  if (colorListRef.value) {
    const currentHeight = colorListRef.value.offsetHeight;
    settingsStore.updateColorMenuHeight(currentHeight);
  }
}

// Toggle all visible colors
function toggleAllColors() {
  // Check if all filtered colors are disabled
  const allDisabled = colorFilter.filteredColors.value.every(c => c.isDisabled);

  if (allDisabled) {
    colorFilter.enableAllColors();
  } else {
    colorFilter.disableAllColors();
  }
}

// Handle color item click (toggle enabled/disabled)
function onColorClick(colorKey, event) {
  // Don't toggle if clicking on checkbox
  if (event.target.type === 'checkbox') return;
  colorFilter.toggleColorEnabled(colorKey);
}

// Handle enhanced checkbox change
function onEnhancedChange(colorKey) {
  colorFilter.toggleColorEnhanced(colorKey);
}

// Apply saved height from store
function applySavedHeight() {
  if (colorListRef.value && settingsStore.colorMenuHeight) {
    colorListRef.value.style.maxHeight = `${settingsStore.colorMenuHeight}px`;
  }
}

// Start auto-update for statistics
function startAutoUpdate() {
  if (autoUpdateInterval) clearInterval(autoUpdateInterval);

  // Trigger reactivity update every 5 seconds
  // Note: pixelStats in useColorFilter is already computed and reactive
  // This interval is kept for legacy compatibility
  autoUpdateInterval = setInterval(() => {
    // Force a slight state change to trigger any stale watchers
    // The computed properties should handle this automatically
  }, 5000);
}

onMounted(() => {
  applySavedHeight();
  startAutoUpdate();

  // Add document-level event listeners for resize
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
  document.addEventListener('touchmove', onResizeMove, { passive: false });
  document.addEventListener('touchend', onResizeEnd);
});

onUnmounted(() => {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }

  // Remove document-level event listeners
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
  document.removeEventListener('touchmove', onResizeMove);
  document.removeEventListener('touchend', onResizeEnd);
});
</script>

<template>
  <!-- Minimized state: show only icon button -->
  <button
    v-if="minimized && showColorMenu"
    id="bm-color-filter-btn-minimized"
    class="w-14 h-9.5 text-[20px] flex items-center justify-center bg-linear-to-br from-mm-blue to-mm-blue-dark border-none rounded-lg cursor-pointer transition-all duration-200 ease-in-out mx-auto mt-1 hover:from-mm-blue-light hover:to-mm-blue hover:scale-105"
    title="Color Filter"
    @click="onMinimizedButtonClick">
    🎨
  </button>

  <!-- Normal state: show full menu -->
  <div
    v-if="!minimized && showColorMenu"
    id="bm-color-menu"
    :class="{ 'mobile-mode': mobileMode }"
    class="bg-white/5 rounded-lg p-3 border border-white/10 mt-2">
    <!-- Toolbar: Search, Sort, Toggle All -->
    <div class="toolbar flex gap-1.5 items-center mb-1.5">
      <div>
        <input
          id="bm-color-search"
          v-model="colorFilter.searchQuery.value"
          autocomplete="off"
          class="flex-1 py-1 px-2 text-[11px] border border-white/20 rounded bg-white/10 text-white min-w-0 max-w-30"
          placeholder="🔍 Search colors..."
          type="text"
          @keydown.stop
          @keyup.stop
          @keypress.stop />
      </div>
      <div>
        <select
          id="bm-color-sort"
          v-model="colorFilter.sortMode.value"
          class="sort-select py-1 px-1.5 text-[11px] border border-white/20 rounded bg-white/10 text-white flex-1 min-w-20">
          <option value="default">Default</option>
          <option value="premium">Premium 💧</option>
          <option value="wrong-desc">Most Wrong</option>
          <option value="missing-desc">Most Missing</option>
          <option value="missing-asc">Less Missing</option>
          <option value="painted-desc">Most Painted</option>
          <option value="painted-asc">Less Painted</option>
          <option value="enhanced">Enhanced Only</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>
      <div>
        <button
          id="bm-color-toggle-all"
          class="py-1 px-2 text-[11px] border border-white/20 rounded bg-white/10 text-white cursor-pointer whitespace-nowrap hover:bg-white/20"
          title="Enable/Disable All Colors"
          @click="toggleAllColors">
          ⚡
        </button>
      </div>
    </div>

    <!-- Color List -->
    <div
      id="bm-color-list"
      ref="colorListRef"
      class="flex flex-col gap-0.75 max-h-35 overflow-y-auto"
      style="scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.3) transparent;">
      <div
        v-for="color in colorFilter.filteredColors.value"
        :key="color.colorKey"
        :class="{ 'opacity-50': color.isDisabled }"
        class="flex items-center gap-1.5 py-1.5 px-2 rounded border border-white/10 bg-white/5 text-[11px] leading-[1.3] min-h-7 transition-all duration-200 cursor-pointer hover:bg-white/10"
        @click="onColorClick(color.colorKey, $event)">

        <!-- Enhanced checkbox -->
        <input
          :checked="color.isEnhanced"
          class="w-4 h-4 cursor-pointer accent-yellow-400 shrink-0"
          title="Enhanced mode (priority rendering)"
          type="checkbox"
          @change.stop="onEnhancedChange(color.colorKey)" />

        <!-- Color swatch -->
        <div
          :style="{ background: `rgb(${color.colorInfo.rgb.join(',')})` }"
          class="w-4 h-4 rounded-sm border border-white/20 shrink-0">
        </div>

        <!-- Color info -->
        <div class="flex-1 overflow-hidden min-w-0 flex items-center gap-1 whitespace-nowrap">
          <span class="text-white font-medium">{{ color.colorInfo.name }}</span>
          <span class="text-[#888]">
            {{ formatNumber(color.stats.painted) }} / {{ formatNumber(color.stats.totalRequired) }}
          </span>
          <span class="text-[#888]">({{ color.stats.percentage }}%)</span>
          <span class="text-mm-orange-light font-bold">{{ formatNumber(color.stats.needsCrosshair) }}</span>
          <span v-if="!color.colorInfo.free" class="text-[10px] opacity-70 ml-auto">💧</span>
        </div>
      </div>

      <!-- No colors message -->
      <p v-if="colorFilter.filteredColors.value.length === 0" class="my-2 text-[#888] text-center text-[10px]">
        {{ colorFilter.searchQuery.value ? 'No colors match your search' : 'No template colors available' }}
      </p>
    </div>

    <!-- Resize Handle -->
    <div
      id="bm-color-menu-resize-handle"
      class="h-2 bg-white/5 cursor-ns-resize rounded-b-md flex items-center justify-center transition-colors duration-200 mt-1 hover:bg-white/10"
      @mousedown="onResizeStart"
      @touchstart.prevent="onResizeStart">
      <div class="w-7.5 h-0.75 bg-white/30 rounded-sm"></div>
    </div>
  </div>
</template>

<style scoped>
/* Select option background (can't be done with utilities) */
.sort-select option {
  background: #2a2a2a;
  color: white;
}

/* ========================================
   Mobile Mode Styles
   ======================================== */

/* Mobile mode container */
#bm-color-menu.mobile-mode {
  padding: 8px;
  border-radius: 6px;
}

/* Mobile toolbar */
#bm-color-menu.mobile-mode .toolbar {
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

#bm-color-menu.mobile-mode #bm-color-search {
  padding: 6px 8px;
  font-size: 10px;
  max-width: 100px;
  min-height: 32px;
}

#bm-color-menu.mobile-mode .sort-select {
  padding: 6px 4px;
  font-size: 10px;
  min-width: 70px;
  min-height: 32px;
}

#bm-color-menu.mobile-mode #bm-color-toggle-all {
  padding: 6px 10px;
  font-size: 10px;
  min-height: 32px;
}

/* Mobile color list */
#bm-color-menu.mobile-mode #bm-color-list {
  gap: 2px;
  max-height: 120px;
}

/* Mobile color items - more compact */
#bm-color-menu.mobile-mode #bm-color-list > div {
  padding: 4px 6px;
  gap: 4px;
  font-size: 10px;
  min-height: 24px;
  border-radius: 3px;
}

#bm-color-menu.mobile-mode #bm-color-list input[type="checkbox"] {
  width: 14px;
  height: 14px;
}

#bm-color-menu.mobile-mode #bm-color-list > div > div:first-of-type {
  width: 14px;
  height: 14px;
}

#bm-color-menu.mobile-mode #bm-color-list > div > div:last-of-type {
  gap: 3px;
}

#bm-color-menu.mobile-mode #bm-color-list > div > div:last-of-type > span:first-child {
  font-size: 10px;
}

#bm-color-menu.mobile-mode #bm-color-list > div > div:last-of-type > span:nth-child(2),
#bm-color-menu.mobile-mode #bm-color-list > div > div:last-of-type > span:nth-child(3) {
  font-size: 9px;
}

#bm-color-menu.mobile-mode #bm-color-list > div > div:last-of-type > span:nth-child(4) {
  font-size: 9px;
}

#bm-color-menu.mobile-mode #bm-color-list > div > div:last-of-type > span:last-child {
  font-size: 8px;
}

/* Mobile resize handle */
#bm-color-menu.mobile-mode #bm-color-menu-resize-handle {
  height: 12px;
  margin-top: 2px;
}

#bm-color-menu.mobile-mode #bm-color-menu-resize-handle > div {
  width: 40px;
  height: 4px;
}

/* Mobile no colors message */
#bm-color-menu.mobile-mode #bm-color-list > p {
  font-size: 9px;
  margin: 4px 0;
}
</style>
