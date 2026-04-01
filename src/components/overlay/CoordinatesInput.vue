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
import { useCoordinateStore } from '@/stores/coordinateStore.js';
import BaseInput from '@/components/common/BaseInput.vue';
import * as icons from '@@/old-src/icons.js';

// Use coordinates store - directly use store refs for two-way binding
const coordinateStore = useCoordinateStore();

// Handle Detect button click
const handleDetect = () => {
  if (!coordinateStore.copyDetectedToInput()) {
    alert('No pixel selected. Please select a pixel on the canvas first.');
  }
};
</script>

<template>
  <div id="bm-contain-coords" class="flex flex-col gap-2 mt-[0.5em]">
    <div id="bm-coords-title" class="grid grid-cols-[auto_1fr_auto] items-center gap-2">
      <div class="coords-pin-icon" v-html="icons.pinIcon"></div>
      <p>Coordinates:</p>
      <button
        id="bm-button-coords"
        class="inline-flex justify-center items-center gap-1 py-0.5 px-2 bg-mm-blue-btn border-none rounded-sm cursor-pointer font-inherit text-inherit transition-colors duration-250 align-middle hover:bg-mm-blue-btn-hover focus-visible:bg-mm-blue-btn-hover active:bg-[#50a9f1]"
        title="Set the location to the pixel you've selected"
        @click="handleDetect">
        <span class="inline-flex items-center leading-none" v-html="icons.pointerIcon"></span>
        Detect
      </button>
    </div>

    <div id="bm-contain-inputs" class="grid grid-cols-4 items-center gap-2">
      <p class="hidden">Tile: </p>
      <BaseInput
        id="bm-input-tx"
        v-model="coordinateStore.inputTileX"
        type="number"
        variant="coordinate"
        :max="2047"
        :min="0"
        :step="1"
        required
        no-validation-style
        placeholder="T1 X" />
      <BaseInput
        id="bm-input-ty"
        v-model="coordinateStore.inputTileY"
        type="number"
        variant="coordinate"
        :max="2047"
        :min="0"
        :step="1"
        required
        no-validation-style
        placeholder="T1 Y" />
      <BaseInput
        id="bm-input-px"
        v-model="coordinateStore.inputPixelX"
        type="number"
        variant="coordinate"
        :max="999"
        :min="0"
        :step="1"
        required
        no-validation-style
        placeholder="Px X" />
      <BaseInput
        id="bm-input-py"
        v-model="coordinateStore.inputPixelY"
        type="number"
        variant="coordinate"
        :max="999"
        :min="0"
        :step="1"
        required
        no-validation-style
        placeholder="Px Y" />
    </div>
  </div>
</template>

<style scoped>
/* SVG icon styling via :deep */
#bm-button-coords span :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.coords-pin-icon :deep(svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}
</style>
