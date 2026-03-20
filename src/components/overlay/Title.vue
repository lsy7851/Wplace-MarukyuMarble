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
  minimized: Boolean,
});

const emits = defineEmits([ 'update:minimized' ]);

const minimized = computed({
  get: () => props.minimized,
  set: (value) => {
    emits('update:minimized', value);
  },
});

const toggleMinimized = () => {
  minimized.value = !minimized.value;
};
</script>
<template>
  <div
    id="bm-title-container"
    class="flex items-center justify-center gap-2"
    :class="{ 'justify-center': minimized }">
    <p
      class="cursor-pointer w-[42px] h-[42px] text-[42px] leading-[42px] transition-transform duration-200 ease-in-out hover:scale-110"
      @click="toggleMinimized"
      :title="minimized ? 'Click to maximize' : 'Click to minimize'">⑨</p>
    <h1 v-show="!minimized" class="font-black text-2xl">Marukyu Marble</h1>
  </div>
</template>
