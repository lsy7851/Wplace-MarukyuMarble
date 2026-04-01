<template>
  <Transition name="compact-fade">
    <div
      v-if="modelValue"
      id="bmcf-compact-list"
      ref="compactRef"
      :style="draggableStyle"
      class="fixed w-60 bg-mm-bg-darkest border border-mm-bg-border rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] z-9002 font-[Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] flex flex-col max-h-150">
        <!-- Header -->
        <div class="flex items-center justify-between px-3 py-2.5 bg-linear-to-br from-mm-bg-dark to-mm-bg-medium border-b border-mm-bg-border rounded-t-xl cursor-move select-none" ref="dragHandleRef">
          <!-- Left Section -->
          <div class="flex items-center gap-2 flex-1">
            <!-- Collapse Arrow -->
            <button
              class="bg-transparent border-none text-mm-text-muted text-xs cursor-pointer p-1 flex items-center justify-center transition-transform duration-200 ease-in-out hover:text-mm-text-primary"
              :class="{ collapsed: isCollapsed }"
              @click.stop="toggleCollapse">
              {{ isCollapsed ? '►' : '▼' }}
            </button>
            <!-- Title -->
            <h3 class="m-0 text-[0.95em] font-semibold text-mm-text-primary">Color Toggle</h3>
          </div>

          <!-- Close Button -->
          <button class="bg-linear-to-br from-mm-error to-mm-error-dark border border-mm-error/30 text-white w-6 h-6 rounded-md cursor-pointer text-sm flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)]" @click.stop="handleClose">✕</button>
        </div>

        <!-- Collapsible Content -->
        <Transition name="collapse">
          <div v-if="!isCollapsed" class="flex flex-col overflow-hidden">
            <!-- Search -->
            <div class="px-3 py-2.5 border-b border-mm-bg-border">
              <BaseInput
                v-model="compactSearch"
                variant="compact"
                placeholder="Search colors...">
                <template #suffix>
                  <button
                    v-if="compactSearch"
                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-mm-text-secondary cursor-pointer text-sm p-1 flex items-center justify-center hover:text-mm-text-dim"
                    @click="compactSearch = ''">
                    ✕
                  </button>
                </template>
              </BaseInput>
            </div>

            <!-- Bulk Actions -->
            <div class="flex gap-1.5 px-3 py-2 border-b border-mm-bg-border">
              <button class="flex-1 h-7 rounded-md border-none text-[0.8em] font-semibold cursor-pointer transition-all duration-200 ease-in-out bg-mm-red text-white hover:bg-[#da190b] hover:-translate-y-px" @click="handleDisableAll">
                Disable All
              </button>
              <button class="flex-1 h-7 rounded-md border-none text-[0.8em] font-semibold cursor-pointer transition-all duration-200 ease-in-out bg-mm-success-light text-white hover:bg-[#45a049] hover:-translate-y-px" @click="handleEnableAll">
                Enable All
              </button>
            </div>

            <!-- Sort -->
            <div class="flex items-center gap-2 px-3 py-2 border-b border-mm-bg-border">
              <label class="text-[0.8em] text-mm-text-muted font-semibold">Sort:</label>
              <select v-model="compactSort" class="flex-1 h-7 px-2 py-1 rounded-md border border-mm-bg-muted bg-mm-bg-dark text-mm-text-primary text-[0.8em] cursor-pointer outline-none focus:border-mm-blue">
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
            <div class="compact-content max-h-75 overflow-y-auto p-2">
              <div
                v-for="color in sortedCompactColors"
                :key="color.colorKey"
                class="flex items-center gap-2 px-2 py-1.5 mb-1 bg-white/5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/8"
                :data-color-rgb="color.colorKey"
                :data-original-index="color.originalIndex"
                :data-remaining="color.stats.needsCrosshair"
                :data-painted="color.stats.painted"
                :data-total="color.stats.totalRequired"
                :data-progress="color.stats.percentage">
                <!-- Color Swatch -->
                <ColorSwatch :rgb="color.colorInfo.rgb" size="sm" />

                <!-- Name & Stats -->
                <div class="flex-1 min-w-0">
                  <div class="text-[0.75em] font-semibold text-mm-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{{ color.colorInfo.name }}</div>
                  <div v-if="color.stats.totalRequired > 0" class="text-[0.65em] text-mm-text-secondary mt-0.5">
                    {{ color.stats.painted }}/{{ color.stats.totalRequired }}
                    <span class="text-emerald-400 font-semibold">({{ color.stats.percentage }}%)</span>
                  </div>
                  <div v-else class="text-[0.65em] text-mm-bg-light mt-0.5">Not Used</div>
                </div>

                <!-- Controls -->
                <div class="flex items-center gap-1.5">
                  <!-- Premium Icon -->
                  <div v-if="!color.colorInfo.free" class="text-[10px] opacity-80">💧</div>

                  <!-- Enhanced Checkbox -->
                  <Checkbox
                    :id="`compact-enhanced-${color.colorKey}`"
                    :checked="color.isEnhanced"
                    :disabled="color.isDisabled"
                    size="sm"
                    @change="handleToggleEnhanced(color.colorKey)" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
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
import { ref, computed, watch } from 'vue';
import { useDraggable } from '@vueuse/core';
import Checkbox from '@/components/common/Checkbox.vue';
import ColorSwatch from '@/components/common/ColorSwatch.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import { useColorFilter } from '@/composables/features/useColorFilter.js';
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
/* Scrollbar */
.compact-content::-webkit-scrollbar {
  width: 6px;
}

.compact-content::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 3px;
}

.compact-content::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

.compact-content::-webkit-scrollbar-thumb:hover {
  background: #64748b;
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
