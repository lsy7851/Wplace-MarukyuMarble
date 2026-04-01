<template>
  <Transition name="modal-fade">
    <div
      v-if="modelValue"
      class="fixed top-0 left-0 w-full h-full z-9001 flex items-center justify-center"
      style="pointer-events: none;">
      <div
        id="bm-color-filter-overlay"
        ref="modalRef"
        :class="{ 'mobile-mode': mobileMode }"
        :style="draggableStyle"
        class="bmcf-overlay fixed w-[min(94vw,670px)] max-h-[88vh] bg-mm-bg-darkest text-mm-text-primary rounded-[20px] border border-mm-bg-border shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] flex flex-col overflow-hidden font-[Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] backdrop-blur-lg"
        style="pointer-events: auto;">
        <!-- Header -->
        <div
          ref="dragHandleRef"
          class="flex flex-col px-5 pt-4 pb-3 border-b border-mm-bg-border bg-linear-to-br from-mm-bg-dark to-mm-bg-medium relative z-1 cursor-move select-none shrink-0">
          <!-- Drag Bar -->
          <div
            class="bg-linear-to-r from-mm-bg-muted via-mm-bg-light to-mm-bg-muted rounded h-1.5 cursor-grab w-full mb-2 opacity-80 transition-opacity duration-200 ease-in-out hover:opacity-100"></div>

          <!-- Title Container -->
          <div class="flex items-center justify-between w-full">
            <h2
              class="modal-title m-0 text-[1.5em] font-bold font-[Inter,-apple-system,BlinkMacSystemFont,sans-serif] text-center flex-1 pointer-events-none tracking-tight bg-linear-to-br from-mm-text-primary to-mm-text-muted bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              Template Color Filter</h2>
            <button
              :title="`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`"
              class="header-btn bg-linear-to-br from-mm-bg-muted to-mm-bg-border border border-mm-bg-light text-mm-text-muted w-9 h-9 rounded-xl cursor-pointer text-base flex items-center justify-center ml-3 transition-all duration-200 ease-in-out relative overflow-hidden hover:-translate-y-px hover:scale-105 hover:from-mm-bg-light hover:to-mm-bg-muted hover:shadow-[0_6px_20px_rgba(71,85,105,0.3)]"
              @click="toggleView">
              {{ viewMode === 'grid' ? '📋' : '⊞' }}
            </button>
            <button
              class="header-btn bg-linear-to-br from-mm-bg-muted to-mm-bg-border border border-mm-bg-light text-mm-text-muted w-9 h-9 rounded-xl cursor-pointer text-base flex items-center justify-center ml-3 transition-all duration-200 ease-in-out relative overflow-hidden hover:-translate-y-px hover:scale-105 hover:from-mm-bg-light hover:to-mm-bg-muted hover:shadow-[0_6px_20px_rgba(71,85,105,0.3)]"
              title="Toggle Compact Color List"
              @click="handleCompactList">
              📌
            </button>
            <button
              class="header-btn bg-linear-to-br from-mm-bg-muted to-mm-bg-border border border-mm-bg-light text-mm-text-muted w-9 h-9 rounded-xl cursor-pointer text-base flex items-center justify-center ml-3 transition-all duration-200 ease-in-out relative overflow-hidden hover:-translate-y-px hover:scale-105 hover:from-mm-bg-light hover:to-mm-bg-muted hover:shadow-[0_6px_20px_rgba(71,85,105,0.3)]"
              @click="handleSettings">
              <span v-html="settingsIcon"></span>
            </button>
            <button
              class="bg-linear-to-br from-mm-error to-mm-error-dark border border-mm-error/30 text-white font-semibold w-9 h-9 rounded-xl cursor-pointer text-base flex items-center justify-center ml-3 transition-all duration-200 ease-in-out relative overflow-hidden hover:-translate-y-px hover:scale-105 hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]"
              @click="handleClose">
              ✕
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 overflow-auto relative z-1 flex-1 min-h-0">
          <!-- Progress Summary -->
          <div
            class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-2xl p-5 mb-6 text-mm-text-primary text-center relative overflow-hidden">
            <!-- Background Pattern -->
            <div
              class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none"></div>

            <!-- Content -->
            <div class="relative z-1">
              <!-- Title with percentage -->
              <div class="text-[1.2em] font-bold mb-3 text-mm-text-primary">
                <span class="mr-2">📊</span>
                <span
                  class="bg-linear-to-br from-mm-blue-light to-emerald-400 bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                    Template Progress: {{ overallProgress.percentage }}%
                  </span>
              </div>

              <!-- Pixels painted info -->
              <div class="text-[0.95em] text-mm-text-muted mb-4 leading-relaxed">
                {{ overallProgress.totalPainted.toLocaleString() }} / {{ overallProgress.totalRequired.toLocaleString() }} pixels
                painted
                <span v-if="includeWrongPixels && overallProgress.totalWrong > 0" class="text-mm-text-secondary">
                    (includes {{ overallProgress.totalWrong.toLocaleString() }} wrong)
                  </span>
              </div>

              <!-- Progress Bar -->
              <ProgressBar :percentage="overallProgress.percentage" />

              <!-- Pixels Remaining -->
              <div class="text-[0.85em] text-mm-warning mt-3 font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                {{ overallProgress.totalRemaining.toLocaleString() }} Pixels Remaining
              </div>
            </div>
          </div>

          <!-- Include Wrong Color Pixels -->
          <div
            class="flex items-center gap-3 px-4 py-3 bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest rounded-xl border border-mm-bg-border mb-6">
            <Checkbox
              id="bm-include-wrong-progress"
              v-model="includeWrongPixels"
              size="lg">
              <span class="text-mm-text-primary text-[0.95em] font-medium flex-1 tracking-tight">
                Include Wrong Color Pixels in Progress
              </span>
            </Checkbox>
          </div>

          <!-- Instructions -->
          <p
            class="m-0 mb-5 px-4 py-3 bg-linear-to-br from-mm-blue/10 to-mm-success/5 border border-mm-blue/20 rounded-xl text-[0.9em] text-mm-text-muted text-center font-medium leading-relaxed">
            Click color name to toggle visibility. Use checkboxes for enhanced mode or progress exclusion.
          </p>

          <!-- Enhanced Mode Section -->
          <div class="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
            <div class="text-[0.95em] font-semibold text-mm-text-muted mb-2.5 text-center">
              🎯 Enhanced Mode Settings
              <span style="font-size: 0.8em; color: rgba(255,255,255,0.6); display: block; margin-top: 2px;">Larger crosshair for selected colors</span>
            </div>
            <div class="flex gap-2 mb-2">
              <button
                class="flex-1 bg-mm-success-light border-none text-white px-4 py-2 rounded-md cursor-pointer text-[0.9em] whitespace-nowrap font-semibold transition-all duration-200 ease-in-out hover:bg-[#45a049] hover:-translate-y-px"
                @click="handleEnableAll">Enable All
              </button>
              <button
                class="flex-1 bg-mm-red border-none text-white px-4 py-2 rounded-md cursor-pointer text-[0.9em] whitespace-nowrap font-semibold transition-all duration-200 ease-in-out hover:bg-[#da190b] hover:-translate-y-px"
                @click="handleDisableAll">Disable All
              </button>
            </div>
            <button
              class="bg-[#6c757d] text-white border-none px-3.5 py-1.5 rounded-md cursor-pointer w-full text-[0.9em] font-semibold transition-all duration-200 ease-in-out hover:bg-[#5a6268] hover:-translate-y-px"
              @click="handleDisableAllEnhanced">
              Disable all Enhanced
            </button>
            <div class="flex items-center gap-2 mt-2 p-2 bg-white/5 rounded-md">
              <Checkbox
                id="bm-enhance-wrong"
                v-model="enhanceWrongColors"
                accent-color="accent-mm-warning-accent">
                <span class="text-mm-text-primary text-[0.85em] font-medium flex-1">
                  Enhance Wrong Colors (Crosshair)
                </span>
              </Checkbox>
            </div>
          </div>

          <!-- Search -->
          <div class="mb-4">
            <input
              v-model="searchQuery"
              class="w-full h-11 px-4 py-3 rounded-xl border border-mm-bg-border bg-mm-bg-dark text-mm-text-primary outline-none text-[0.95em] transition-all duration-200 ease-in-out focus:border-mm-blue focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2),0_4px_12px_rgba(59,130,246,0.15)]"
              placeholder="Search colors..."
              type="text" />
          </div>

          <!-- Filter/Sort -->
          <div class="flex items-center gap-3 mb-5">
            <label class="text-[0.95em] font-semibold text-mm-text-muted whitespace-nowrap">Sort by:</label>
            <select
              v-model="sortMode"
              class="flex-1 h-10 px-3 py-2 rounded-[10px] border border-mm-bg-border bg-mm-bg-dark text-mm-text-primary text-[0.9em] cursor-pointer outline-none transition-all duration-200 ease-in-out hover:border-mm-bg-muted focus:border-mm-blue focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]">
              <option value="default">Default</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="premium">Premium First</option>
              <option value="enhanced">Enhanced Only</option>
              <option value="wrong-desc">Most Wrong</option>
              <option value="wrong-asc">Least Wrong</option>
              <option value="missing-desc">Most Missing</option>
              <option value="missing-asc">Least Missing</option>
              <option value="total-desc">Most Total</option>
              <option value="total-asc">Least Total</option>
              <option value="percentage-desc">Highest %</option>
              <option value="percentage-asc">Lowest %</option>
            </select>
          </div>

          <!-- Colors Display -->
          <div
            :class="{ 'list-mode': viewMode === 'list' }">
            <!-- Grid View -->
            <div
              :class="{ 'hidden!': viewMode === 'list' }"
              class="bmcf-grid grid grid-cols-4 gap-2 mb-5 justify-center">
              <ColorFilterItem
                v-for="color in filteredColors"
                :key="color.colorKey"
                :color="color"
                @toggle-enabled="toggleColorEnabled(color.colorKey)"
                @toggle-enhanced="toggleColorEnhanced(color.colorKey)"
                @toggle-excluded="toggleColorExcluded(color.colorKey)" />
            </div>

            <!-- List View -->
            <div
              :class="{ 'hidden!': viewMode !== 'list' }"
              class="bmcf-list flex flex-col gap-2.5">
              <ColorFilterItem
                v-for="color in filteredColors"
                :key="color.colorKey"
                :color="color"
                list-view
                @toggle-enabled="toggleColorEnabled(color.colorKey)"
                @toggle-enhanced="toggleColorEnhanced(color.colorKey)"
                @toggle-excluded="toggleColorExcluded(color.colorKey)" />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex gap-3 justify-center items-center px-5 py-4 border-t border-mm-bg-border bg-linear-to-br from-mm-bg-dark to-mm-bg-medium relative z-1">
          <button
            class="bmcf-btn inline-flex items-center justify-center h-10 px-4.5 min-w-30 rounded-xl border border-mm-success-dark text-[0.9em] font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ease-in-out relative overflow-hidden bg-linear-to-br from-mm-success to-mm-success-dark text-white hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:from-mm-success-dark hover:to-mm-success-darker"
            @click="handleUpdateStats">
            🔄 Update Stats
          </button>
          <button
            class="bmcf-btn inline-flex items-center justify-center h-10 px-4.5 min-w-30 rounded-xl border border-mm-blue-dark text-[0.9em] font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ease-in-out relative overflow-hidden bg-linear-to-br from-mm-blue to-mm-blue-dark text-white hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:from-mm-blue-dark hover:to-mm-blue-darker"
            @click="handleApply">
            🎯 Apply Colors
          </button>
        </div>
      </div>
    </div>
  </Transition>
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
import { computed, onMounted, ref } from 'vue';
import { useDraggable } from '@vueuse/core';
import ColorFilterItem from '@/components/color-filter/ColorFilterItem.vue';
import Checkbox from '@/components/common/Checkbox.vue';
import ProgressBar from '@/components/common/ProgressBar.vue';
import { useColorFilter } from '@/composables/features/useColorFilter.js';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([ 'update:modelValue', 'toggle-compact-list', 'close' ]);

// Settings icon SVG
const settingsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m-6-6h6m6 0h-6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"></path></svg>`;

// Stores
const templateStore = useTemplateStore();
const settingsStore = useSettingsStore();
// Stores
// Mobile mode from store
const mobileMode = computed(() => settingsStore.mobileMode);

// Computed for enhance wrong colors (synced with store)
const enhanceWrongColors = computed({
  get: () => settingsStore.enhanceWrongColors,
  set: async (value) => {
    await settingsStore.updateEnhanceWrongColors(value);
    // Clear tile cache and refresh when setting changes
    tileCache.clear();
    // Force re-render by toggling templatesShouldBeDrawn
    templateStore.templatesShouldBeDrawn = false;
    await new Promise(resolve => setTimeout(resolve, 50));
    templateStore.templatesShouldBeDrawn = true;
  },
});

// Color filter composable
const {
  searchQuery,
  sortMode,
  viewMode,
  includeWrongPixels,  // Use from composable
  filteredColors,
  overallProgress,
  toggleColorEnabled,
  toggleColorEnhanced,
  toggleColorExcluded,
  enableAllColors,
  disableAllColors,
  disableAllEnhanced,
  loadTemplateColors,
  saveTemplateColors,
  saveSettings,
} = useColorFilter();

// Draggable setup
const modalRef = ref(null);
const dragHandleRef = ref(null);

const { x, y, style: draggableStyle, isDragging } = useDraggable(modalRef, {
  initialValue: { x: window.innerWidth / 2 - 335, y: 100 },
  preventDefault: true,
  handle: dragHandleRef,
});

/**
 * Toggle view mode
 */
function toggleView() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  saveSettings();
}

/**
 * Handle close
 */
function handleClose() {
  emit('update:modelValue', false);
}

/**
 * Handle Update Stats
 */
function handleUpdateStats() {
  // TODO: Rebuild overlay with fresh data
}

/**
 * Handle Compact List
 */
function handleCompactList() {
  emit('toggle-compact-list');
}

/**
 * Handle Settings
 */
function handleSettings() {
  // TODO: Open crosshair settings overlay
}

/**
 * Handle Enable All
 */
async function handleEnableAll() {
  await enableAllColors();
  saveSettings();
}

/**
 * Handle Disable All
 */
async function handleDisableAll() {
  await disableAllColors();
  saveSettings();
}

/**
 * Handle Disable All Enhanced
 */
async function handleDisableAllEnhanced() {
  await disableAllEnhanced();
  saveSettings();
}

/**
 * Handle Apply
 */
async function handleApply() {
  await saveTemplateColors();
  saveSettings();
  emit('update:modelValue', false);
}

// Load template colors on mount
onMounted(() => {
  // Load colors from current template (index 0 for now, TODO: support multiple templates)
  if (templateStore.templates.length > 0) {
    loadTemplateColors(templateStore.currentIndex);
  }
});
</script>

<style scoped>
/* Overlay ::before gradient */
.bmcf-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.05));
  pointer-events: none;
}

/* Button ::before hover effect */
.bmcf-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.bmcf-btn:hover::before {
  opacity: 1;
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ========================================
   Mobile Mode Styles
   ======================================== */

.mobile-mode {
  width: min(350px, 96vw);
  max-height: 70vh;
  font-size: 12px;
}

.mobile-mode .bmcf-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

/* Mobile responsive */
@media (max-width: 520px) {
  .bmcf-btn {
    min-width: 100px;
    height: 36px;
    font-size: 0.85em;
  }
}
</style>
