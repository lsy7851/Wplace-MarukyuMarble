<template>
  <Teleport to="body">
    <Transition name="compact-fade">
      <div
        v-if="modelValue"
        id="bmcf-compact-list"
        ref="compactRef"
        :style="draggableStyle"
        class="bmcf-compact-list">
        <!-- Header -->
        <div class="compact-header" ref="dragHandleRef">
          <!-- Left Section -->
          <div class="compact-left-section">
            <!-- Collapse Arrow -->
            <button
              class="compact-collapse-arrow"
              :class="{ collapsed: isCollapsed }"
              @click.stop="toggleCollapse">
              {{ isCollapsed ? '►' : '▼' }}
            </button>
            <!-- Title -->
            <h3 class="compact-title">Color Toggle</h3>
          </div>

          <!-- Close Button -->
          <button class="compact-close-btn" @click.stop="handleClose">✕</button>
        </div>

        <!-- Collapsible Content -->
        <Transition name="collapse">
          <div v-if="!isCollapsed" class="compact-collapsible-content">
            <!-- Search -->
            <div class="compact-search-container">
              <input
                v-model="compactSearch"
                type="text"
                class="compact-search-input"
                placeholder="Search colors..." />
              <button
                v-if="compactSearch"
                class="compact-clear-search"
                @click="compactSearch = ''">
                ✕
              </button>
            </div>

            <!-- Bulk Actions -->
            <div class="compact-bulk-container">
              <button class="compact-disable-all" @click="handleDisableAll">
                Disable All
              </button>
              <button class="compact-enable-all" @click="handleEnableAll">
                Enable All
              </button>
            </div>

            <!-- Sort -->
            <div class="compact-sort-container">
              <label class="compact-sort-label">Sort:</label>
              <select v-model="compactSort" class="compact-sort-select">
                <option value="default">Default</option>
                <option value="name">Name</option>
                <option value="premium">Premium</option>
                <option value="most-missing">Most Missing</option>
                <option value="less-missing">Less Missing</option>
                <option value="remaining">Remaining</option>
                <option value="progress">Progress %</option>
                <option value="most-painted">Most Painted</option>
                <option value="less-painted">Less Painted</option>
                <option value="enhanced">Enhanced Only</option>
              </select>
            </div>

            <!-- Color List -->
            <div class="compact-content">
              <div
                v-for="color in sortedCompactColors"
                :key="color.colorKey"
                class="compact-item"
                :data-color-rgb="color.colorKey"
                :data-original-index="color.originalIndex"
                :data-remaining="color.stats.needsCrosshair"
                :data-painted="color.stats.painted"
                :data-total="color.stats.totalRequired"
                :data-progress="color.stats.percentage">
                <!-- Color Swatch -->
                <div
                  class="compact-swatch"
                  :style="{
                    background: `rgb(${color.colorInfo.rgb[0]}, ${color.colorInfo.rgb[1]}, ${color.colorInfo.rgb[2]})`
                  }"></div>

                <!-- Name & Stats -->
                <div class="compact-name">
                  <div class="compact-name-text">{{ color.colorInfo.name }}</div>
                  <div v-if="color.stats.totalRequired > 0" class="compact-stats">
                    {{ color.stats.painted }}/{{ color.stats.totalRequired }}
                    <span class="compact-progress">({{ color.stats.percentage }}%)</span>
                  </div>
                  <div v-else class="compact-stats-unused">Not Used</div>
                </div>

                <!-- Controls -->
                <div class="compact-controls-container">
                  <!-- Premium Icon -->
                  <div v-if="!color.colorInfo.free" class="compact-premium-icon">💧</div>

                  <!-- Enhanced Checkbox -->
                  <input
                    :id="`compact-enhanced-${color.colorKey}`"
                    type="checkbox"
                    :checked="color.isEnhanced"
                    :disabled="color.isDisabled"
                    class="compact-enhanced-checkbox"
                    @change="handleToggleEnhanced(color.colorKey)" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDraggable } from '@vueuse/core';
import { useColorFilter } from '@/composables/useColorFilter.js';
import { useColorFilterStore } from '@/stores/colorFilterStore.js';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Color filter composable
const {
  colorData,
  toggleColorEnhanced,
  enableAllColors,
  disableAllColors,
  saveSettings
} = useColorFilter();

// Color filter store
const colorFilterStore = useColorFilterStore();

// State
const compactSearch = ref('');
const compactSort = ref(colorFilterStore.compactSort || 'default');
const isCollapsed = ref(colorFilterStore.compactCollapsed || false);

// Draggable setup
const compactRef = ref(null);
const dragHandleRef = ref(null);

const { x, y, style: draggableStyle } = useDraggable(compactRef, {
  initialValue: { x: window.innerWidth - 260, y: 100 },
  preventDefault: true,
  handle: dragHandleRef,
});

/**
 * Filtered and sorted colors for compact list
 */
const sortedCompactColors = computed(() => {
  let colors = colorData.value.map((c, index) => ({
    ...c,
    originalIndex: index
  }));

  // Search filter
  if (compactSearch.value.trim()) {
    const query = compactSearch.value.toLowerCase();
    colors = colors.filter(c =>
      c.colorInfo.name.toLowerCase().includes(query)
    );
  }

  // Sort
  switch (compactSort.value) {
    case 'name':
      colors.sort((a, b) => a.colorInfo.name.localeCompare(b.colorInfo.name));
      break;

    case 'premium':
      colors.sort((a, b) => {
        const aFree = a.colorInfo.free ? 0 : 1;
        const bFree = b.colorInfo.free ? 0 : 1;
        if (bFree !== aFree) return bFree - aFree;
        return b.stats.needsCrosshair - a.stats.needsCrosshair;
      });
      break;

    case 'most-missing':
      colors.sort((a, b) => b.stats.needsCrosshair - a.stats.needsCrosshair);
      break;

    case 'less-missing':
      colors.sort((a, b) => a.stats.needsCrosshair - b.stats.needsCrosshair);
      break;

    case 'remaining':
      colors.sort((a, b) => b.stats.needsCrosshair - a.stats.needsCrosshair);
      break;

    case 'progress':
      colors.sort((a, b) => b.stats.percentage - a.stats.percentage);
      break;

    case 'most-painted':
      colors.sort((a, b) => b.stats.painted - a.stats.painted);
      break;

    case 'less-painted':
      colors.sort((a, b) => a.stats.painted - b.stats.painted);
      break;

    case 'enhanced':
      colors = colors.filter(c => c.isEnhanced);
      break;

    default: // 'default'
      // Keep original order
      break;
  }

  return colors;
});

/**
 * Toggle collapse state
 */
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  colorFilterStore.updateCompactCollapsed(isCollapsed.value);
}

/**
 * Handle toggle enhanced for a color
 */
function handleToggleEnhanced(colorKey) {
  toggleColorEnhanced(colorKey);
  saveSettings();
}

/**
 * Handle enable all
 */
function handleEnableAll() {
  enableAllColors();
  saveSettings();
}

/**
 * Handle disable all
 */
function handleDisableAll() {
  disableAllColors();
  saveSettings();
}

/**
 * Handle close
 */
function handleClose() {
  emit('update:modelValue', false);
}

// Save sort preference when it changes
watch(compactSort, (newValue) => {
  colorFilterStore.updateCompactSort(newValue);
});
</script>

<style scoped>
.bmcf-compact-list {
  position: fixed;
  width: 240px;
  background: var(--slate-900, #0f172a);
  border: 1px solid var(--slate-700, #334155);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  z-index: 9002;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

/* Header */
.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: linear-gradient(135deg, #1e293b, #293548);
  border-bottom: 1px solid var(--slate-700, #334155);
  border-radius: 12px 12px 0 0;
  cursor: move;
  user-select: none;
}

.compact-left-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.compact-collapse-arrow {
  background: none;
  border: none;
  color: var(--slate-300, #cbd5e1);
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.compact-collapse-arrow:hover {
  color: var(--slate-100, #f1f5f9);
}

.compact-title {
  margin: 0;
  font-size: 0.95em;
  font-weight: 600;
  color: var(--slate-100, #f1f5f9);
}

.compact-close-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.compact-close-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Collapsible Content */
.compact-collapsible-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Search */
.compact-search-container {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid var(--slate-700, #334155);
}

.compact-search-input {
  width: 100%;
  height: 32px;
  padding: 6px 28px 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--slate-600, #475569);
  background: var(--slate-800, #1e293b);
  color: var(--slate-100, #f1f5f9);
  font-size: 0.85em;
  outline: none;
  transition: all 0.2s ease;
}

.compact-search-input:focus {
  border-color: var(--blue-500, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.compact-clear-search {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--slate-400, #94a3b8);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compact-clear-search:hover {
  color: var(--slate-200, #e2e8f0);
}

/* Bulk Actions */
.compact-bulk-container {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--slate-700, #334155);
}

.compact-disable-all,
.compact-enable-all {
  flex: 1;
  height: 28px;
  border-radius: 6px;
  border: none;
  font-size: 0.8em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.compact-disable-all {
  background: #f44336;
  color: white;
}

.compact-disable-all:hover {
  background: #da190b;
  transform: translateY(-1px);
}

.compact-enable-all {
  background: #4CAF50;
  color: white;
}

.compact-enable-all:hover {
  background: #45a049;
  transform: translateY(-1px);
}

/* Sort */
.compact-sort-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--slate-700, #334155);
}

.compact-sort-label {
  font-size: 0.8em;
  color: var(--slate-300, #cbd5e1);
  font-weight: 600;
}

.compact-sort-select {
  flex: 1;
  height: 28px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--slate-600, #475569);
  background: var(--slate-800, #1e293b);
  color: var(--slate-100, #f1f5f9);
  font-size: 0.8em;
  cursor: pointer;
  outline: none;
}

.compact-sort-select:focus {
  border-color: var(--blue-500, #3b82f6);
}

/* Content */
.compact-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.compact-content::-webkit-scrollbar {
  width: 6px;
}

.compact-content::-webkit-scrollbar-track {
  background: var(--slate-800, #1e293b);
  border-radius: 3px;
}

.compact-content::-webkit-scrollbar-thumb {
  background: var(--slate-600, #475569);
  border-radius: 3px;
}

.compact-content::-webkit-scrollbar-thumb:hover {
  background: var(--slate-500, #64748b);
}

/* Compact Item */
.compact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transition: background 0.2s ease;
}

.compact-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.compact-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.compact-name {
  flex: 1;
  min-width: 0;
}

.compact-name-text {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--slate-100, #f1f5f9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-stats {
  font-size: 0.65em;
  color: var(--slate-400, #94a3b8);
  margin-top: 2px;
}

.compact-progress {
  color: var(--emerald-400, #34d399);
  font-weight: 600;
}

.compact-stats-unused {
  font-size: 0.65em;
  color: var(--slate-500, #64748b);
  margin-top: 2px;
}

.compact-controls-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.compact-premium-icon {
  font-size: 10px;
  opacity: 0.8;
}

.compact-enhanced-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--blue-500, #3b82f6);
}

.compact-enhanced-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.compact-fade-enter-active,
.compact-fade-leave-active {
  transition: opacity 0.2s ease;
}

.compact-fade-enter-from,
.compact-fade-leave-to {
  opacity: 0;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
