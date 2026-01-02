/**
 * Coordinate Store - Manages canvas coordinate detection
 * Stores the last clicked pixel coordinates from Wplace.live canvas
 */
import { defineStore } from 'pinia';

export const useCoordinateStore = defineStore('coordinate', () => {
  const tileX = ref();
  const tileY = ref();
  const pixelX = ref();
  const pixelY = ref();

  const hasCoords = computed(() => {
    return tileX.value !== undefined && tileY.value !== undefined &&
      pixelX.value !== undefined && pixelY.value !== undefined;
  });

  const coordsObject = computed(() => ({
    tileX: tileX.value ?? null,
    tileY: tileY.value ?? null,
    pixelX: pixelX.value ?? null,
    pixelY: pixelY.value ?? null,
  }));

  const setCoords = ({ tileX: tx, tileY: ty, pixelX: px, pixelY: py }) => {
    // Validate coordinates
    if (
      typeof tx !== 'number' ||
      typeof ty !== 'number' ||
      typeof px !== 'number' ||
      typeof py !== 'number'
    ) {
      console.error('❌ [coordinateStore] Invalid coordinates:', { tx, ty, px, py });
      return;
    }
    // Validate ranges
    if (
      tx < 0 || tx > 2047 ||
      ty < 0 || ty > 2047 ||
      px < 0 || px > 999 ||
      py < 0 || py > 999
    ) {
      console.warn('⚠️ [coordinateStore] Coordinates out of range:', { tx, ty, px, py });
    }

    tileX.value = tx;
    tileY.value = ty;
    pixelX.value = px;
    pixelY.value = py;
  };

  const clearCoords = () => {
    tileX.value = undefined;
    tileY.value = undefined;
    pixelX.value = undefined;
    pixelY.value = undefined;
  };

  return {
    tileX,
    tileY,
    pixelX,
    pixelY,
    hasCoords,
    coordsObject,
    setCoords,
    clearCoords,
  };
});
