<template>
  <div class="flex flex-col items-center gap-3">
    <div
      ref="previewRef"
      class="relative flex size-15 items-center justify-center rounded-xl border-2 border-mm-bg-light shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
      :style="{ background: backgroundColor }">
      <!-- Crosshair pattern -->
      <div
        class="grid h-full w-full gap-px bg-black/10"
        :class="enhancedSize ? 'grid-cols-5 grid-rows-5' : 'grid-cols-3 grid-rows-3'">
        <!-- Standard 3x3 pattern or Enhanced 5x5 pattern -->
        <template v-if="!enhancedSize">
          <!-- Row 1 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 2 -->
          <div :style="{ background: pixelColor }"></div>
          <div class="box-border border-2 border-white/40 bg-black"></div>
          <div :style="{ background: pixelColor }"></div>

          <!-- Row 3 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
        </template>

        <template v-else>
          <!-- Enhanced 5x5 pattern -->
          <!-- Row 1 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 2 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 3 (center row) -->
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div class="box-border border-2 border-white/40 bg-black"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: pixelColor }"></div>

          <!-- Row 4 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 5 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
        </template>
      </div>
    </div>
    <div class="text-base font-bold tracking-tight text-mm-text-primary">{{ color.name }}</div>
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

const props = defineProps({
  color: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.rgb && Array.isArray(value.rgb) && value.rgb.length === 3 && typeof value.alpha === 'number';
    },
  },
  border: {
    type: Boolean,
    default: false,
  },
  enhancedSize: {
    type: Boolean,
    default: false,
  },
});

// Computed color values
const pixelColor = computed(() => {
  const { rgb, alpha } = props.color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha / 255})`;
});

const borderColor = computed(() => {
  return 'rgba(0, 100, 255, 0.8)'; // Blue borders
});

const backgroundColor = computed(() => {
  return '#475569'; // Slate-600
});
</script>
