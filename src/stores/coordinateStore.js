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
/**
 * Coordinate Store - Manages canvas coordinate detection and user input
 * Stores both detected (clicked) and input (user-entered) coordinates
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCoordinateStore = defineStore('coordinate', () => {
  // Detected coordinates (from canvas click)
  const tileX = ref();
  const tileY = ref();
  const pixelX = ref();
  const pixelY = ref();

  // Input coordinates (from user input fields)
  const inputTileX = ref();
  const inputTileY = ref();
  const inputPixelX = ref();
  const inputPixelY = ref();

  const hasCoords = computed(() => {
    return tileX.value !== undefined && tileY.value !== undefined &&
      pixelX.value !== undefined && pixelY.value !== undefined;
  });

  const hasInputCoords = computed(() => {
    return inputTileX.value !== undefined && inputTileX.value !== '' &&
      inputTileY.value !== undefined && inputTileY.value !== '' &&
      inputPixelX.value !== undefined && inputPixelX.value !== '' &&
      inputPixelY.value !== undefined && inputPixelY.value !== '';
  });

  const coordsObject = computed(() => ({
    tileX: tileX.value ?? null,
    tileY: tileY.value ?? null,
    pixelX: pixelX.value ?? null,
    pixelY: pixelY.value ?? null,
  }));

  const inputCoordsObject = computed(() => ({
    tileX: inputTileX.value !== undefined && inputTileX.value !== '' ? Number(inputTileX.value) : null,
    tileY: inputTileY.value !== undefined && inputTileY.value !== '' ? Number(inputTileY.value) : null,
    pixelX: inputPixelX.value !== undefined && inputPixelX.value !== '' ? Number(inputPixelX.value) : null,
    pixelY: inputPixelY.value !== undefined && inputPixelY.value !== '' ? Number(inputPixelY.value) : null,
  }));

  const setCoords = ({ tileX: tx, tileY: ty, pixelX: px, pixelY: py }) => {
    // Validate coordinates
    if (
      typeof tx !== 'number' ||
      typeof ty !== 'number' ||
      typeof px !== 'number' ||
      typeof py !== 'number'
    ) {
      return;
    }

    tileX.value = tx;
    tileY.value = ty;
    pixelX.value = px;
    pixelY.value = py;
  };

  const setInputCoords = ({ tileX: tx, tileY: ty, pixelX: px, pixelY: py }) => {
    inputTileX.value = tx;
    inputTileY.value = ty;
    inputPixelX.value = px;
    inputPixelY.value = py;
  };

  const clearCoords = () => {
    tileX.value = undefined;
    tileY.value = undefined;
    pixelX.value = undefined;
    pixelY.value = undefined;
  };

  const clearInputCoords = () => {
    inputTileX.value = undefined;
    inputTileY.value = undefined;
    inputPixelX.value = undefined;
    inputPixelY.value = undefined;
  };

  const copyDetectedToInput = () => {
    if (!hasCoords.value) {
      return false;
    }
    inputTileX.value = String(tileX.value);
    inputTileY.value = String(tileY.value);
    inputPixelX.value = String(pixelX.value);
    inputPixelY.value = String(pixelY.value);
    return true;
  };

  return {
    // Detected coordinates
    tileX,
    tileY,
    pixelX,
    pixelY,
    hasCoords,
    coordsObject,
    setCoords,
    clearCoords,
    // Input coordinates
    inputTileX,
    inputTileY,
    inputPixelX,
    inputPixelY,
    hasInputCoords,
    inputCoordsObject,
    setInputCoords,
    clearInputCoords,
    copyDetectedToInput,
  };
});
