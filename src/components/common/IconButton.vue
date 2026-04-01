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

defineProps({
  title: {
    type: String,
    default: '',
  },
  active: {
    type: Boolean,
    default: false,
  },
  activeClass: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <button
    :title="title"
    :class="[
      // Base: square icon button
      'inline-flex items-center justify-center shrink-0',
      'size-6 p-0 rounded',
      'border border-white',
      'bg-mm-blue-btn hover:bg-mm-blue-btn-hover active:bg-mm-blue-btn-active',
      'cursor-pointer font-inherit text-inherit',
      'transition-colors duration-250',
      'leading-none text-center',
      // SVG sizing handled via deep selector below
      // Active state override
      active && activeClass,
    ]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
button :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}
</style>
