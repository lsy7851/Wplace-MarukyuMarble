<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        style="pointer-events: none;">
        <div
          id="bm-color-filter-overlay"
          ref="modalRef"
          class="bmcf-overlay"
          :class="{ 'mobile-mode': mobileMode }"
          :style="draggableStyle"
          style="pointer-events: auto;">
          <!-- Header -->
          <div class="bmcf-header" ref="dragHandleRef">
            <!-- Drag Bar -->
            <div class="bmcf-drag-bar"></div>

            <!-- Title Container -->
            <div class="title-container">
              <h2 class="modal-title">Template Color Filter</h2>
              <button
                class="view-toggle-btn"
                :title="`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`"
                @click="toggleView">
                {{ viewMode === 'grid' ? '📋' : '⊞' }}
              </button>
              <button
                class="compact-list-btn"
                title="Toggle Compact Color List"
                @click="handleCompactList">
                📌
              </button>
              <button
                class="settings-btn"
                @click="handleSettings">
                <span v-html="settingsIcon"></span>
              </button>
              <button
                class="close-btn"
                @click="handleClose">
                ✕
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="bmcf-content">
            <!-- Progress Summary -->
            <div class="progress-summary">
              <!-- Background Pattern -->
              <div class="progress-bg-pattern"></div>

              <!-- Content -->
              <div class="progress-content">
                <!-- Title with percentage -->
                <div class="progress-title">
                  <span class="progress-icon">📊</span>
                  <span class="progress-title-gradient">
                    Template Progress: {{ overallProgress.percentage }}%
                  </span>
                </div>

                <!-- Pixels painted info -->
                <div class="progress-pixels">
                  {{ overallProgress.totalPainted.toLocaleString() }} / {{ overallProgress.totalRequired.toLocaleString() }} pixels painted
                  <span v-if="includeWrongPixels && overallProgress.totalWrong > 0" class="progress-wrong-info">
                    (includes {{ overallProgress.totalWrong.toLocaleString() }} wrong)
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{ width: overallProgress.percentage + '%' }">
                    <div class="progress-shimmer"></div>
                  </div>
                </div>

                <!-- Pixels Remaining -->
                <div class="progress-remaining">
                  {{ overallProgress.totalRemaining.toLocaleString() }} Pixels Remaining
                </div>
              </div>
            </div>

            <!-- Include Wrong Color Pixels -->
            <div class="include-wrong-container">
              <input
                id="bm-include-wrong-progress"
                v-model="includeWrongPixels"
                type="checkbox"
                class="wrong-checkbox" />
              <label for="bm-include-wrong-progress" class="wrong-label">
                Include Wrong Color Pixels in Progress
              </label>
            </div>

            <!-- Instructions -->
            <p class="instructions-text">
              Click color name to toggle visibility. Use checkboxes for enhanced mode or progress exclusion.
            </p>

            <!-- Enhanced Mode Section -->
            <div class="enhanced-section">
              <div class="enhanced-info">
                🎯 Enhanced Mode Settings
                <span style="font-size: 0.8em; color: rgba(255,255,255,0.6); display: block; margin-top: 2px;">Larger crosshair for selected colors</span>
              </div>
              <div class="main-buttons-container">
                <button class="enable-all-btn" @click="handleEnableAll">Enable All</button>
                <button class="disable-all-btn" @click="handleDisableAll">Disable All</button>
              </div>
              <button class="disable-all-enhanced-btn" @click="handleDisableAllEnhanced">
                Disable all Enhanced
              </button>
              <div class="enhance-wrong-container">
                <input
                  id="bm-enhance-wrong"
                  v-model="enhanceWrongColors"
                  type="checkbox"
                  class="enhance-checkbox" />
                <label for="bm-enhance-wrong" class="enhance-label">
                  Enhance Wrong Colors (Crosshair)
                </label>
              </div>
            </div>

            <!-- Search -->
            <div class="search-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                class="bmcf-input"
                placeholder="Search colors..." />
            </div>

            <!-- Filter/Sort -->
            <div class="filter-wrapper">
              <label class="filter-label">Sort by:</label>
              <select v-model="sortMode" class="filter-select">
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
              class="bmcf-view-container"
              :class="{ 'list-mode': viewMode === 'list' }">
              <!-- Grid View -->
              <div class="bmcf-grid">
                <ColorFilterItem
                  v-for="color in filteredColors"
                  :key="color.colorKey"
                  :color="color"
                  @toggle-enabled="toggleColorEnabled(color.colorKey)"
                  @toggle-enhanced="toggleColorEnhanced(color.colorKey)"
                  @toggle-excluded="toggleColorExcluded(color.colorKey)" />
              </div>

              <!-- List View -->
              <div class="bmcf-list">
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
          <div class="bmcf-footer">
            <button class="bmcf-btn success" @click="handleUpdateStats">
              🔄 Update Stats
            </button>
            <button class="bmcf-btn primary" @click="handleApply">
              🎯 Apply Colors
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useDraggable } from '@vueuse/core';
import ColorFilterItem from '@/components/color-filter/ColorFilterItem.vue';
import { useColorFilter } from '@/composables/useColorFilter.js';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useTileCache } from '@/composables/useTileCache.js';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'toggle-compact-list', 'close']);

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
  }
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
  saveSettings
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
/* Backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9001;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Overlay - matching old-src exactly */
.bmcf-overlay {
  width: min(94vw, 670px);
  max-height: 88vh;
  background: var(--slate-900, #0f172a);
  color: var(--slate-100, #f1f5f9);
  border-radius: 20px;
  border: 1px solid var(--slate-700, #334155);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  backdrop-filter: blur(16px);
  position: fixed;
}

.bmcf-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.05));
  pointer-events: none;
}

/* Header */
.bmcf-header {
  display: flex;
  flex-direction: column;
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid var(--slate-700, #334155);
  background: linear-gradient(135deg, #1e293b, #293548);
  position: relative;
  z-index: 1;
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}

/* Drag Bar */
.bmcf-drag-bar {
  background: linear-gradient(90deg, #475569 0%, #64748b 50%, #475569 100%);
  border-radius: 4px;
  cursor: grab;
  width: 100%;
  height: 6px;
  margin-bottom: 8px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.bmcf-drag-bar:hover {
  opacity: 1;
}

/* Title Container */
.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.modal-title {
  margin: 0;
  font-size: 1.5em;
  font-weight: 700;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  text-align: center;
  flex: 1;
  pointer-events: none;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Header Buttons */
.view-toggle-btn,
.compact-list-btn,
.settings-btn,
.close-btn {
  background: linear-gradient(135deg, #475569, #334155);
  border: 1px solid #64748b;
  color: #cbd5e1;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.close-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: white;
  font-weight: 600;
}

.view-toggle-btn:hover,
.compact-list-btn:hover,
.settings-btn:hover {
  transform: translateY(-1px) scale(1.05);
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow: 0 6px 20px rgba(71, 85, 105, 0.3);
}

.close-btn:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

/* Content */
.bmcf-content {
  padding: 20px;
  overflow: auto;
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}

/* Progress Summary */
.progress-summary {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  color: #f1f5f9;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.progress-bg-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.08), transparent 50%);
  pointer-events: none;
}

.progress-content {
  position: relative;
  z-index: 1;
}

.progress-title {
  font-size: 1.2em;
  font-weight: 700;
  margin-bottom: 12px;
  color: #f1f5f9;
}

.progress-icon {
  margin-right: 8px;
}

.progress-title-gradient {
  background: linear-gradient(135deg, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-pixels {
  font-size: 0.95em;
  color: #cbd5e1;
  margin-bottom: 16px;
  line-height: 1.5;
}

.progress-wrong-info {
  color: #94a3b8;
}

.progress-track {
  width: 100%;
  height: 12px;
  background: #334155;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-remaining {
  font-size: 0.85em;
  color: #fbbf24;
  margin-top: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Include Wrong Container */
.include-wrong-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 12px;
  border: 1px solid #334155;
  margin-bottom: 24px;
}

.wrong-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
  border-radius: 4px;
}

.wrong-label {
  color: #f1f5f9;
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  flex: 1;
  letter-spacing: -0.01em;
}

/* Instructions */
.instructions-text {
  margin: 0 0 20px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  font-size: 0.9em;
  color: #cbd5e1;
  text-align: center;
  font-weight: 500;
  line-height: 1.5;
}

/* Enhanced Section */
.enhanced-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.enhanced-info {
  font-size: 0.95em;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 10px;
  text-align: center;
}

.main-buttons-container {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.enable-all-btn {
  background: #4CAF50;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  white-space: nowrap;
  flex: 1;
  font-weight: 600;
  transition: all 0.2s ease;
}

.enable-all-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.disable-all-btn {
  background: #f44336;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  white-space: nowrap;
  flex: 1;
  font-weight: 600;
  transition: all 0.2s ease;
}

.disable-all-btn:hover {
  background: #da190b;
  transform: translateY(-1px);
}

.disable-all-enhanced-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-size: 0.9em;
  font-weight: 600;
  transition: all 0.2s ease;
}

.disable-all-enhanced-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Enhance Wrong Container */
.enhance-wrong-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.enhance-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #f59e0b;
}

.enhance-label {
  color: #f1f5f9;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  flex: 1;
}

/* Search */
.search-wrapper {
  margin-bottom: 16px;
}

.bmcf-input {
  width: 100%;
  height: 44px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #f1f5f9;
  outline: none;
  font-size: 0.95em;
  transition: all 0.2s ease;
}

.bmcf-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(59, 130, 246, 0.15);
}

/* Filter */
.filter-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-label {
  font-size: 0.95em;
  font-weight: 600;
  color: #cbd5e1;
  white-space: nowrap;
}

.filter-select {
  flex: 1;
  height: 40px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #f1f5f9;
  font-size: 0.9em;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: #475569;
}

.filter-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* View Container */
.bmcf-view-container .bmcf-grid {
  display: grid;
}

.bmcf-view-container .bmcf-list {
  display: none;
}

.bmcf-view-container.list-mode .bmcf-grid {
  display: none !important;
}

.bmcf-view-container.list-mode .bmcf-list {
  display: flex !important;
}

/* Grid */
.bmcf-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}

/* List */
.bmcf-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Footer */
.bmcf-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #334155;
  background: linear-gradient(135deg, #1e293b, #293548);
  position: relative;
  z-index: 1;
}

.bmcf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 18px;
  min-width: 120px;
  border-radius: 12px;
  border: 1px solid #334155;
  font-size: 0.9em;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: #334155;
  color: #f1f5f9;
}

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

/* ========================================
   Mobile Mode Styles
   ======================================== */

.bmcf-overlay.mobile-mode {
  width: min(350px, 96vw);
  max-height: 70vh;
  font-size: 12px;
}

.bmcf-overlay.mobile-mode .bmcf-header {
  padding: 8px 12px 0 12px;
}

.bmcf-overlay.mobile-mode .modal-title {
  font-size: 1.2em;
}

.bmcf-overlay.mobile-mode .bmcf-content {
  padding: 12px;
}

.bmcf-overlay.mobile-mode .bmcf-footer {
  padding: 8px 12px;
}

.bmcf-overlay.mobile-mode .view-toggle-btn,
.bmcf-overlay.mobile-mode .compact-list-btn,
.bmcf-overlay.mobile-mode .settings-btn,
.bmcf-overlay.mobile-mode .close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  margin-left: 8px;
}

.bmcf-overlay.mobile-mode .bmcf-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.bmcf-overlay.mobile-mode .bmcf-input {
  height: 36px;
  padding: 6px 10px;
  font-size: 13px;
}

.bmcf-overlay.mobile-mode .filter-select {
  height: 36px;
  padding: 6px 10px;
  font-size: 13px;
}

.bmcf-overlay.mobile-mode .bmcf-btn {
  height: 36px;
  padding: 0 12px;
  font-size: 0.85em;
  min-width: 100px;
}

.bmcf-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.bmcf-btn.success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-color: #059669;
}

.bmcf-btn.success:hover {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.bmcf-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-color: #2563eb;
}

.bmcf-btn.primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
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

/* Mobile */
@media (max-width: 520px) {
  .bmcf-btn {
    min-width: 100px;
    height: 36px;
    font-size: 0.85em;
  }

  .modal-title {
    font-size: 1.2em;
  }

  .view-toggle-btn,
  .compact-list-btn,
  .settings-btn,
  .close-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}
</style>
