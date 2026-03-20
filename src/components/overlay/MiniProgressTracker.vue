<template>
  <div
    v-if="shouldShow"
    id="bm-mini-tracker"
    class="bg-[linear-gradient(135deg,#1e293b,#334155)] border border-mm-bg-muted rounded-xl px-4 py-3 mt-2 text-mm-text-primary font-sans shadow-[0_4px_12px_rgba(0,0,0,0.3)] w-full text-[0.85rem] grid grid-cols-1 grid-rows-[auto_auto_auto_auto] gap-[6px] tracking-[-0.01em] box-border select-none cursor-default transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
    <div class="text-base font-bold w-full text-left text-mm-text-primary tracking-[-0.02em] leading-[1.2] relative z-1">
      {{ progressTitle }}
    </div>
    <div class="text-[0.8rem] text-mm-text-muted w-full text-left font-medium leading-[1.2] relative z-1">
      {{ progressPixels }}
    </div>
    <div class="h-2 bg-mm-bg-muted rounded-md overflow-hidden w-full border border-mm-bg-light min-w-0 relative z-[1]">
      <div
        class="h-full bg-[linear-gradient(90deg,#3b82f6,#10b981)] rounded-sm transition-[width] duration-300 ease-in-out min-w-0"
        :style="{ width: `${progressPercentage}%` }">
      </div>
    </div>
    <div class="text-[0.8rem] text-mm-warning w-full text-left font-semibold leading-[1.2] relative z-1">
      {{ progressLeft }}
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
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useProgressTracking } from '@/composables/features/useProgressTracking.js';

// Props
const props = defineProps({
  minimized: {
    type: Boolean,
    default: false,
  },
});

// Stores
const settingsStore = useSettingsStore();
const templateStore = useTemplateStore();

// Progress tracking composable
const { aggregatedProgress, formatNumber } = useProgressTracking();

// Settings
const { miniTrackerEnabled, collapseMinEnabled } = storeToRefs(settingsStore);

/**
 * Should the tracker be shown?
 * - Hidden if disabled
 * - Hidden if collapse is enabled AND overlay is minimized
 */
const shouldShow = computed(() => {
  if (!miniTrackerEnabled.value) {
    return false;
  }

  if (collapseMinEnabled.value && props.minimized) {
    return false;
  }

  return true;
});

/**
 * Progress percentage (0-100)
 */
const progressPercentage = computed(() => {
  return aggregatedProgress.value.percentage || 0;
});

/**
 * Progress title text
 */
const progressTitle = computed(() => {
  return `📊 Template Progress: ${progressPercentage.value}%`;
});

/**
 * Progress pixels text
 */
const progressPixels = computed(() => {
  const { totalPainted, totalRequired } = aggregatedProgress.value;
  return `${formatNumber(totalPainted)} / ${formatNumber(totalRequired)} pixels painted`;
});

/**
 * Pixels left text
 */
const progressLeft = computed(() => {
  const { remaining } = aggregatedProgress.value;
  return `${formatNumber(remaining)} Pixels Left`;
});
</script>

<style scoped>
/* ::before pseudo-element for hover overlay - can't be expressed as pure utilities */
#bm-mini-tracker::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

#bm-mini-tracker:hover::before {
  opacity: 1;
}
</style>
