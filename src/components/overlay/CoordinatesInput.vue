<script setup>
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
  <div id="bm-contain-coords">
    <div id="bm-coords-title">
      <div v-html="icons.pinIcon"></div>
      <p>Coordinates:</p>
      <button
        id="bm-button-coords"
        title="Set the location to the pixel you've selected"
        @click="handleDetect">
        <span v-html="icons.pointerIcon"></span>
        Detect
      </button>
    </div>

    <div id="bm-contain-inputs">
      <p>Tile: </p>
      <input
        id="bm-input-tx"
        v-model="coordinateStore.inputTileX"
        max="2047"
        min="0"
        placeholder="T1 X"
        required
        step="1"
        type="number" />
      <input
        id="bm-input-ty"
        v-model="coordinateStore.inputTileY"
        max="2047"
        min="0"
        placeholder="T1 Y"
        required
        step="1"
        type="number" />
      <input
        id="bm-input-px"
        v-model="coordinateStore.inputPixelX"
        max="999"
        min="0"
        placeholder="Px X"
        required
        step="1"
        type="number" />
      <input
        id="bm-input-py"
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
/* Coordinates container */
#bm-contain-coords {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-top: 0.5em;
}

#bm-coords-title {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: .5rem;
}

/* Base button styles */
#bm-contain-coords button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: .25rem;
  padding: .125rem .5rem;
  background-color: #2190ED;
  border: none;
  border-radius: .25rem;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: background-color 0.25s;
}

#bm-contain-coords button:hover,
#bm-contain-coords button:focus-visible {
  background-color: #3b9def;
}

#bm-contain-coords button:active {
  background-color: #50a9f1;
}

#bm-contain-coords #bm-contain-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: .5rem;
}

#bm-contain-coords #bm-contain-inputs p {
  display: none; /* Hide the "Tile:" and "Pixel:" labels */
}

/* Tile (x, y) & Pixel (x, y) input fields */
#bm-contain-coords #bm-contain-inputs input {
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
}

#bm-contain-coords #bm-contain-inputs input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  outline: none;
}

#bm-contain-coords #bm-contain-inputs input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

/* Tile (x, y) & Pixel (x, y) input fields */
#bm-contain-coords input[type="number"] {
  appearance: auto;
  -moz-appearance: textfield;
  width: 3.2ch;
  margin-left: 0.3ch;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0 0.2ch;
  font-size: small;
}

/* Removes scroll bar on tile & pixel input fields */
#bm-contain-coords input[type="number"]::-webkit-outer-spin-button,
#bm-contain-coords input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* CRITICAL: Remove red borders from HTML5 validation on coordinate inputs */
#bm-input-tx:invalid,
#bm-input-ty:invalid,
#bm-input-px:invalid,
#bm-input-py:invalid {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Pin button */
#bm-button-coords {
  vertical-align: middle;
}

/* SVG icon styling */
#bm-contain-coords button span {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

#bm-contain-coords button span :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

/* Pin icon in title */
#bm-coords-title > div :deep(svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}
</style>
