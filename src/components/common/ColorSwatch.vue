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
  rgb: {
    type: Array,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v),
  },
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-3.5 h-3.5 rounded-[3px] border border-white/20';
    case 'lg': return 'size-8 rounded-md border border-white/20';
    default: return 'w-6 h-6 rounded border-2 border-white/20';
  }
});

const bgStyle = computed(() => ({
  background: `rgb(${props.rgb[0]}, ${props.rgb[1]}, ${props.rgb[2]})`,
}));
</script>

<template>
  <div
    :class="['shrink-0', sizeClass]"
    :style="bgStyle" />
</template>
