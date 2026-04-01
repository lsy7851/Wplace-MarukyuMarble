<template>
  <!-- Grid View Item -->
  <div
    v-if="!listView"
    class="relative box-border flex h-30 w-full flex-col items-center justify-center overflow-hidden rounded-lg p-[12px_8px_16px_8px] text-center transition-all duration-200 ease-in-out"
    :style="{
      background: `rgb(${color.colorInfo.rgb[0]}, ${color.colorInfo.rgb[1]}, ${color.colorInfo.rgb[2]})`,
      border: `3px solid ${color.isDisabled ? '#f44336' : '#4caf50'}`
    }">
    <!-- Controls Container -->
    <div class="mt-1.5 flex w-full shrink-0 flex-col items-center gap-0.5">
      <!-- Click Area for Enable/Disable -->
      <div class="relative flex h-5 w-full cursor-pointer items-center justify-center" @click="emit('toggle-enabled')">
        <!-- Disabled Overlay -->
        <div v-if="color.isDisabled" class="absolute inset-0 flex items-center justify-center rounded-[5px] bg-[rgba(244,67,54,0.3)] text-base font-bold text-white">✕</div>
      </div>

      <!-- Enhanced Checkbox -->
      <div class="flex items-center justify-center gap-1 text-[0.65em] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
        <Checkbox
          :id="`enhanced-${color.colorKey}`"
          :checked="color.isEnhanced"
          :disabled="color.isDisabled"
          size="xs"
          @change="emit('toggle-enhanced')">
          <span class="cursor-pointer select-none" @click.prevent="handleLabelClick">Enhanced</span>
        </Checkbox>
      </div>
    </div>

    <!-- Color Name -->
    <div class="relative z-1 mb-1.5 shrink-0 text-center text-[0.75em] font-bold leading-tight text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">{{ color.colorInfo.name }}</div>

    <!-- Pixel Stats -->
    <div class="relative z-1 flex min-h-0 grow flex-col justify-center p-[4px_6px] text-center">
      <template v-if="color.stats.totalRequired > 0">
        <div class="mb-px text-[0.6em] leading-tight text-white/90 [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
          {{ color.stats.painted.toLocaleString() }}/{{ color.stats.totalRequired.toLocaleString() }} ({{ color.stats.percentage }}%)
        </div>
        <div class="text-[0.54em] text-white/70 [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
          {{ color.stats.needsCrosshair.toLocaleString() }} Left
        </div>
      </template>
      <template v-else>
        <div class="text-[0.65em] text-white/60 [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">Not Used</div>
      </template>
    </div>

    <!-- Progress Bar -->
    <ProgressBar
      v-if="color.stats.totalRequired > 0"
      :percentage="color.stats.percentage"
      variant="inline"
      class="pointer-events-none absolute inset-x-5 bottom-1.5 z-1" />

    <!-- Premium Droplet Icon -->
    <div v-if="!color.colorInfo.free" class="pointer-events-none absolute right-1.5 top-1.5 z-2 text-xs opacity-80 [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">💧</div>

    <!-- Exclude Icon -->
    <div
      class="exclude-icon absolute bottom-1.5 right-1.5 z-2 cursor-pointer text-sm opacity-70 transition-all duration-200 ease-in-out [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)] hover:scale-120 hover:opacity-100"
      :class="{ excluded: color.isExcluded }"
      :title="color.isExcluded ? 'Click to include in progress' : 'Click to exclude from progress'"
      @click="emit('toggle-excluded')">
      {{ color.isExcluded ? '🚫' : '👁️' }}
    </div>
  </div>

  <!-- List View Item -->
  <div
    v-else
    class="relative flex min-h-12.5 items-center gap-3 rounded-lg bg-white/5 p-[8px_12px] transition-all duration-200 ease-in-out hover:bg-white/8"
    :style="{
      border: `2px solid ${color.isDisabled ? '#f44336' : '#4caf50'}`,
      opacity: color.isDisabled ? '0.6' : '1'
    }">
    <!-- Color Swatch -->
    <ColorSwatch :rgb="color.colorInfo.rgb" size="lg" />

    <!-- Info Container -->
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <!-- Top Row: Name + Main Stats -->
      <div class="flex items-center gap-2">
        <div class="text-[0.9em] font-semibold text-mm-text-primary">{{ color.colorInfo.name }}</div>
        <div v-if="color.stats.totalRequired > 0" class="whitespace-nowrap text-[0.8em] text-mm-text-muted">
          {{ color.stats.painted.toLocaleString() }}/{{ color.stats.totalRequired.toLocaleString() }} ({{ color.stats.percentage }}%)
        </div>
        <div v-else class="text-[0.8em] text-mm-text-secondary">Not Used</div>
      </div>

      <!-- Bottom Row: Left Stats -->
      <div class="flex items-center">
        <div
          v-if="color.stats.totalRequired > 0"
          class="text-[0.75em] font-medium"
          :style="{ color: color.stats.needsCrosshair === 0 ? '#4caf50' : '#ff9800' }">
          {{ color.stats.needsCrosshair.toLocaleString() }} Left
        </div>
      </div>
    </div>

    <!-- Controls Container -->
    <div class="z-2 flex shrink-0 items-center gap-2">
      <!-- Premium Icon -->
      <div v-if="!color.colorInfo.free" class="text-sm opacity-80">💧</div>

      <!-- Exclude Icon -->
      <div
        class="flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/30 text-base opacity-70 transition-all duration-200 ease-in-out hover:scale-110 hover:opacity-100"
        :class="{ 'bg-[rgba(244,67,54,0.8)] opacity-100': color.isExcluded }"
        :title="color.isExcluded ? 'Click to include in progress' : 'Click to exclude from progress'"
        @click.stop="emit('toggle-excluded')">
        {{ color.isExcluded ? '🚫' : '👁️' }}
      </div>

      <!-- Enhanced Checkbox -->
      <Checkbox
        :id="`list-enhanced-${color.colorKey}`"
        :checked="color.isEnhanced"
        :disabled="color.isDisabled"
        @change="emit('toggle-enhanced')">
        <span class="whitespace-nowrap text-[0.75em] text-mm-text-dim" @click.prevent="handleLabelClick">Enhanced</span>
      </Checkbox>
    </div>

    <!-- Click Area for Enable/Disable (Overlay) -->
    <div class="absolute inset-0 z-1 cursor-pointer" @click="emit('toggle-enabled')">
      <div v-if="color.isDisabled" class="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgba(244,67,54,0.2)] text-2xl font-bold text-white">✕</div>
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

import Checkbox from '@/components/common/Checkbox.vue';
import ColorSwatch from '@/components/common/ColorSwatch.vue';
import ProgressBar from '@/components/common/ProgressBar.vue';

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
.exclude-icon.excluded {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 0, 0, 0.8));
}
</style>
