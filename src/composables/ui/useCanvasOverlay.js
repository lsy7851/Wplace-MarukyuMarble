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
import { ref, onMounted, onUnmounted } from 'vue';
import { useTemplateRenderer } from '@/composables/rendering/useTemplateRenderer';

/**
 * Canvas overlay composable
 *
 * Manages the overlay canvas layer on top of MapLibre GL canvas
 * Integrates with template rendering pipeline
 */
export function useCanvasOverlay() {
  const renderer = useTemplateRenderer();

  const overlayCanvas = ref(null);
  const baseCanvas = ref(null);
  const isInitialized = ref(false);

  let resizeObserver = null;
  let mapMoveHandler = null;

  /**
   * Set up canvas overlay
   */
  function setupOverlay() {
    // Find MapLibre GL canvas
    baseCanvas.value = document.querySelector('div#map canvas.maplibregl-canvas');

    if (!baseCanvas.value) {
      setTimeout(setupOverlay, 1000);
      return;
    }

    // Create overlay canvas
    overlayCanvas.value = document.createElement('canvas');
    overlayCanvas.value.id = 'marukyu-marble-overlay';
    overlayCanvas.value.width = baseCanvas.value.width;
    overlayCanvas.value.height = baseCanvas.value.height;

    // Position overlay
    const baseRect = baseCanvas.value.getBoundingClientRect();
    overlayCanvas.value.style.position = 'absolute';
    overlayCanvas.value.style.top = baseRect.top + 'px';
    overlayCanvas.value.style.left = baseRect.left + 'px';
    overlayCanvas.value.style.width = baseRect.width + 'px';
    overlayCanvas.value.style.height = baseRect.height + 'px';
    overlayCanvas.value.style.pointerEvents = 'none';  // Click-through
    overlayCanvas.value.style.zIndex = '1000';

    // Append to map container
    const mapContainer = baseCanvas.value.parentElement;
    mapContainer.appendChild(overlayCanvas.value);

    // Watch for canvas resize
    resizeObserver = new ResizeObserver(() => {
      if (baseCanvas.value && overlayCanvas.value) {
        overlayCanvas.value.width = baseCanvas.value.width;
        overlayCanvas.value.height = baseCanvas.value.height;

        const baseRect = baseCanvas.value.getBoundingClientRect();
        overlayCanvas.value.style.width = baseRect.width + 'px';
        overlayCanvas.value.style.height = baseRect.height + 'px';
      }
    });

    resizeObserver.observe(baseCanvas.value);

    // Hook into MapLibre GL events if available
    if (window.mmmap) {
      mapMoveHandler = () => {
        clearOverlay();
      };

      window.mmmap.on('moveend', mapMoveHandler);
      window.mmmap.on('zoomend', mapMoveHandler);
    }

    isInitialized.value = true;
  }

  /**
   * Tear down overlay
   */
  function teardownOverlay() {
    if (overlayCanvas.value) {
      overlayCanvas.value.remove();
      overlayCanvas.value = null;
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (mapMoveHandler && window.mmmap) {
      window.mmmap.off('moveend', mapMoveHandler);
      window.mmmap.off('zoomend', mapMoveHandler);
      mapMoveHandler = null;
    }

    isInitialized.value = false;
  }

  /**
   * Render a single tile on the overlay
   *
   * NOTE: This approach (separate overlay canvas) may need rework.
   * The old implementation modified tile blobs in fetch interceptor,
   * letting MapLibre GL handle positioning automatically.
   *
   * @param {Blob} tileBlob - Original tile from API
   * @param {[number, number]} tileCoords - [tileX, tileY]
   */
  async function renderTile(tileBlob, tileCoords) {
    if (!overlayCanvas.value) return;

    try {
      const processedBlob = await renderer.drawTemplateOnTile(tileBlob, tileCoords);

      // Draw to overlay canvas
      const bitmap = await createImageBitmap(processedBlob);
      const ctx = overlayCanvas.value.getContext('2d');

      // Position calculation: This needs proper implementation
      // Should use window.mmmap.project() to convert tile coords to screen pixels
      // For now, drawing at origin - will need refactor when integrating with API interceptor
      if (window.mmmap) {
        // Get tile position in world coordinates
        const [tileX, tileY] = tileCoords;
        const worldX = tileX * 1000; // Template.TILE_SIZE = 1000
        const worldY = tileY * 1000;

        // TODO: Convert world coords to screen coords using MapLibre GL's project()
        // const screenPos = window.mmmap.project([worldX, worldY]);
        // ctx.drawImage(bitmap, screenPos.x, screenPos.y);

        ctx.drawImage(bitmap, 0, 0);
      } else {
        ctx.drawImage(bitmap, 0, 0);
      }
    } catch {
      // Ignore render failures
    }
  }

  /**
   * Clear overlay canvas
   */
  function clearOverlay() {
    if (overlayCanvas.value) {
      const ctx = overlayCanvas.value.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height);
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    setupOverlay();
  });

  onUnmounted(() => {
    teardownOverlay();
  });

  return {
    overlayCanvas,
    baseCanvas,
    isInitialized,
    setupOverlay,
    teardownOverlay,
    renderTile,
    clearOverlay
  };
}
