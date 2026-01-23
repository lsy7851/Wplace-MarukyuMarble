<template>
  <!-- Grid View Item -->
  <div
    v-if="!listView"
    class="bmcf-card"
    :style="{
      background: `rgb(${color.colorInfo.rgb[0]}, ${color.colorInfo.rgb[1]}, ${color.colorInfo.rgb[2]})`,
      border: `3px solid ${color.isDisabled ? '#f44336' : '#4caf50'}`
    }">
    <!-- Controls Container -->
    <div class="controls-container">
      <!-- Click Area for Enable/Disable -->
      <div class="color-click-area" @click="emit('toggle-enabled')">
        <!-- Disabled Overlay -->
        <div v-if="color.isDisabled" class="disabled-overlay">✕</div>
      </div>

      <!-- Enhanced Checkbox -->
      <div class="enhanced-container">
        <input
          :id="`enhanced-${color.colorKey}`"
          type="checkbox"
          :checked="color.isEnhanced"
          :disabled="color.isDisabled"
          class="enhanced-checkbox"
          @change="emit('toggle-enhanced')" />
        <label
          :for="`enhanced-${color.colorKey}`"
          class="enhanced-label"
          @click.prevent="handleLabelClick">
          Enhanced
        </label>
      </div>
    </div>

    <!-- Color Name -->
    <div class="color-name">{{ color.colorInfo.name }}</div>

    <!-- Pixel Stats -->
    <div class="pixel-stats">
      <template v-if="color.stats.totalRequired > 0">
        <div class="stats-main">
          {{ color.stats.painted.toLocaleString() }}/{{ color.stats.totalRequired.toLocaleString() }} ({{ color.stats.percentage }}%)
        </div>
        <div class="stats-left">
          {{ color.stats.needsCrosshair.toLocaleString() }} Left
        </div>
      </template>
      <template v-else>
        <div class="stats-unused">Not Used</div>
      </template>
    </div>

    <!-- Progress Bar -->
    <div v-if="color.stats.totalRequired > 0" class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: Math.min(color.stats.percentage, 100) + '%' }"></div>
    </div>

    <!-- Premium Droplet Icon -->
    <div v-if="!color.colorInfo.free" class="droplet-icon">💧</div>

    <!-- Exclude Icon -->
    <div
      class="exclude-icon"
      :class="{ excluded: color.isExcluded }"
      :title="color.isExcluded ? 'Click to include in progress' : 'Click to exclude from progress'"
      @click="emit('toggle-excluded')">
      {{ color.isExcluded ? '🚫' : '👁️' }}
    </div>
  </div>

  <!-- List View Item -->
  <div
    v-else
    class="bmcf-list-item"
    :style="{
      border: `2px solid ${color.isDisabled ? '#f44336' : '#4caf50'}`,
      opacity: color.isDisabled ? '0.6' : '1'
    }">
    <!-- Color Swatch -->
    <div
      class="list-color-swatch"
      :style="{
        background: `rgb(${color.colorInfo.rgb[0]}, ${color.colorInfo.rgb[1]}, ${color.colorInfo.rgb[2]})`
      }"></div>

    <!-- Info Container -->
    <div class="list-info-container">
      <!-- Top Row: Name + Main Stats -->
      <div class="list-top-row">
        <div class="list-color-name">{{ color.colorInfo.name }}</div>
        <div v-if="color.stats.totalRequired > 0" class="list-main-stats">
          {{ color.stats.painted.toLocaleString() }}/{{ color.stats.totalRequired.toLocaleString() }} ({{ color.stats.percentage }}%)
        </div>
        <div v-else class="list-stats-unused">Not Used</div>
      </div>

      <!-- Bottom Row: Left Stats -->
      <div class="list-bottom-row">
        <div
          v-if="color.stats.totalRequired > 0"
          class="list-left-stats"
          :style="{ color: color.stats.needsCrosshair === 0 ? '#4caf50' : '#ff9800' }">
          {{ color.stats.needsCrosshair.toLocaleString() }} Left
        </div>
      </div>
    </div>

    <!-- Controls Container -->
    <div class="list-controls-container">
      <!-- Premium Icon -->
      <div v-if="!color.colorInfo.free" class="list-droplet-icon">💧</div>

      <!-- Exclude Icon -->
      <div
        class="list-exclude-icon"
        :class="{ excluded: color.isExcluded }"
        :title="color.isExcluded ? 'Click to include in progress' : 'Click to exclude from progress'"
        @click.stop="emit('toggle-excluded')">
        {{ color.isExcluded ? '🚫' : '👁️' }}
      </div>

      <!-- Enhanced Checkbox -->
      <input
        :id="`list-enhanced-${color.colorKey}`"
        type="checkbox"
        :checked="color.isEnhanced"
        :disabled="color.isDisabled"
        class="list-enhanced-checkbox"
        @change="emit('toggle-enhanced')" />
      <label
        :for="`list-enhanced-${color.colorKey}`"
        class="list-enhanced-label"
        @click.prevent="handleLabelClick">
        Enhanced
      </label>
    </div>

    <!-- Click Area for Enable/Disable (Overlay) -->
    <div class="list-color-click-area" @click="emit('toggle-enabled')">
      <div v-if="color.isDisabled" class="list-disabled-overlay">✕</div>
    </div>
  </div>
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

// Props
const props = defineProps({
  color: {
    type: Object,
    required: true
  },
  listView: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['toggle-enabled', 'toggle-enhanced', 'toggle-excluded']);

/**
 * Handle label click to toggle checkbox
 */
function handleLabelClick() {
  if (!props.color.isDisabled) {
    emit('toggle-enhanced');
  }
}
</script>

<style scoped>
/* Grid View Card */
.bmcf-card {
  border-radius: 8px;
  padding: 12px 8px 16px 8px;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
}

/* List View Item */
.bmcf-list-item {
  min-height: 50px;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.bmcf-list-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.list-color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.list-info-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.list-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-color-name {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--slate-100, #f1f5f9);
}

.list-main-stats {
  font-size: 0.8em;
  color: var(--slate-300, #cbd5e1);
  white-space: nowrap;
}

.list-stats-unused {
  font-size: 0.8em;
  color: var(--slate-400, #94a3b8);
}

.list-bottom-row {
  display: flex;
  align-items: center;
}

.list-left-stats {
  font-size: 0.75em;
  font-weight: 500;
}

.list-controls-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  z-index: 2;
}

.list-droplet-icon {
  font-size: 14px;
  opacity: 0.8;
}

.list-exclude-icon {
  font-size: 16px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.list-exclude-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.list-exclude-icon.excluded {
  background: rgba(244, 67, 54, 0.8);
  opacity: 1;
}

.list-enhanced-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.list-enhanced-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.list-enhanced-label {
  font-size: 0.75em;
  color: var(--slate-200, #e2e8f0);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.list-color-click-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
  z-index: 1;
}

.list-disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(244, 67, 54, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 24px;
  border-radius: 8px;
}

/* Controls Container */
.controls-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  flex-shrink: 0;
  margin-top: 6px;
}

/* Color Click Area */
.color-click-area {
  width: 100%;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(244, 67, 54, 0.3);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

/* Enhanced Container */
.enhanced-container {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65em;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  justify-content: center;
}

.enhanced-checkbox {
  width: 12px;
  height: 12px;
  cursor: pointer;
}

.enhanced-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.enhanced-label {
  cursor: pointer;
  user-select: none;
}

/* Color Name */
.color-name {
  font-size: 0.75em;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  color: white;
  font-weight: bold;
  z-index: 1;
  position: relative;
  text-align: center;
  margin-bottom: 6px;
  flex-shrink: 0;
  line-height: 1.1;
}

/* Pixel Stats */
.pixel-stats {
  z-index: 1;
  position: relative;
  padding: 4px 6px;
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.stats-main {
  font-size: 0.6em;
  color: rgba(255,255,255,0.9);
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  line-height: 1.1;
  margin-bottom: 1px;
}

.stats-left {
  color: rgba(255,255,255,0.7);
  font-size: 0.54em;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.stats-unused {
  font-size: 0.65em;
  color: rgba(255,255,255,0.6);
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

/* Progress Bar */
.progress-track {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 6px;
  height: 4px;
  background: rgba(255,255,255,0.25);
  border-radius: 2px;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A, #CDDC39);
  transition: width 0.3s ease;
}

/* Droplet Icon */
.droplet-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 12px;
  opacity: 0.8;
  z-index: 2;
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

/* Exclude Icon */
.exclude-icon {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 14px;
  cursor: pointer;
  z-index: 2;
  opacity: 0.7;
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.exclude-icon:hover {
  opacity: 1;
  transform: scale(1.2);
}

.exclude-icon.excluded {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 0, 0, 0.8));
}
</style>
