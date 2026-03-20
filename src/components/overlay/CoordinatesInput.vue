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
      <input
        id="bm-input-tx"
        class="coord-input"
        v-model="coordinateStore.inputTileX"
        max="2047"
        min="0"
        placeholder="T1 X"
        required
        step="1"
        type="number" />
      <input
        id="bm-input-ty"
        class="coord-input"
        v-model="coordinateStore.inputTileY"
        max="2047"
        min="0"
        placeholder="T1 Y"
        required
        step="1"
        type="number" />
      <input
        id="bm-input-px"
        class="coord-input"
        v-model="coordinateStore.inputPixelX"
        max="999"
        min="0"
        placeholder="Px X"
        required
        step="1"
        type="number" />
      <input
        id="bm-input-py"
        class="coord-input"
        v-model="coordinateStore.inputPixelY"
        max="999"
        min="0"
        placeholder="Px Y"
        required
        step="1"
        type="number" />
    </div>
  </div>
</template>

<style scoped>
/* Input field styling */
.coord-input {
  width: 100%;
  height: 2.2rem;
  background: #1e293b;
  border: 1px solid #475569;
  color: #f1f5f9;
  padding: 0 0.5rem;
  font-size: 0.9rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
  appearance: auto;
  -moz-appearance: textfield;
}

.coord-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  outline: none;
}

.coord-input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

/* Remove spinner buttons */
.coord-input::-webkit-outer-spin-button,
.coord-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Remove red borders from HTML5 validation */
#bm-input-tx:invalid,
#bm-input-ty:invalid,
#bm-input-px:invalid,
#bm-input-py:invalid {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

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
