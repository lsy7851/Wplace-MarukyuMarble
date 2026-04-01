<script setup>
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Modified work Copyright (c) 2025 lsy7851 and Marukyu Marble Contributors
 */
import { computed } from 'vue';

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
  },
  variant: {
    type: String,
    default: 'default',
    validator: v => ['default', 'mini', 'inline'].includes(v),
  },
});

const clampedPercentage = computed(() =>
  Math.min(props.percentage, 100),
);

const trackClass = computed(() => {
  switch (props.variant) {
    case 'mini':
      return 'h-2 bg-mm-bg-muted rounded-md overflow-hidden border border-mm-bg-light min-w-0 relative z-[1]';
    case 'inline':
      return 'h-1 overflow-hidden rounded-sm bg-white/25';
    default:
      return 'w-full h-3 bg-mm-bg-border rounded-lg overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]';
  }
});

const fillClass = computed(() => {
  switch (props.variant) {
    case 'mini':
      return 'h-full bg-[linear-gradient(90deg,#3b82f6,#10b981)] rounded-sm transition-[width] duration-300 ease-in-out min-w-0';
    case 'inline':
      return 'h-full bg-linear-to-r from-mm-success-light via-[#8BC34A] to-[#CDDC39] transition-[width] duration-300 ease-in-out';
    default:
      return 'h-full bg-linear-to-r from-mm-blue to-mm-success transition-[width] duration-400 ease-in-out relative overflow-hidden';
  }
});
</script>

<template>
  <div :class="trackClass">
    <div
      :class="fillClass"
      :style="{ width: clampedPercentage + '%' }">
      <div
        v-if="variant === 'default'"
        class="progress-shimmer absolute top-0 -left-full w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent" />
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-shimmer {
  animation: shimmer 2s infinite;
}
</style>
