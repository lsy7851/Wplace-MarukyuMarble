import { ref, onMounted, onUnmounted } from 'vue';
import { useTemplateRenderer } from './useTemplateRenderer';

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
      console.warn('MapLibre GL canvas not found. Retrying in 1s...');
      setTimeout(setupOverlay, 1000);
      return;
    }

    console.log('MapLibre GL canvas found');

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

    console.log('Overlay canvas created and mounted');

    // Watch for canvas resize
    resizeObserver = new ResizeObserver(() => {
      if (baseCanvas.value && overlayCanvas.value) {
        overlayCanvas.value.width = baseCanvas.value.width;
        overlayCanvas.value.height = baseCanvas.value.height;

        const baseRect = baseCanvas.value.getBoundingClientRect();
        overlayCanvas.value.style.width = baseRect.width + 'px';
        overlayCanvas.value.style.height = baseRect.height + 'px';

        console.log('Overlay canvas resized');
      }
    });

    resizeObserver.observe(baseCanvas.value);

    // Hook into MapLibre GL events if available
    if (window.mmmap) {
      mapMoveHandler = () => {
        // Clear overlay on map move/zoom
        // Tiles will be re-rendered when API interceptor receives new tile data
        clearOverlay();
        console.log('Map moved/zoomed - overlay cleared');
      };

      window.mmmap.on('moveend', mapMoveHandler);
      window.mmmap.on('zoomend', mapMoveHandler);

      console.log('MapLibre GL event handlers attached');
    } else {
      console.warn('window.mmmap not available yet - map event handlers not attached');
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
    console.log('Overlay canvas torn down');
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
    if (!overlayCanvas.value) {
      console.warn('Overlay canvas not initialized');
      return;
    }

    try {
      // Use template renderer to process tile
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

        // Temporary: draw at origin
        ctx.drawImage(bitmap, 0, 0);
      } else {
        // Fallback: draw at origin
        ctx.drawImage(bitmap, 0, 0);
      }

      console.log(`Rendered tile ${tileCoords[0]},${tileCoords[1]} on overlay`);
    } catch (e) {
      console.error('Failed to render tile:', e);
    }
  }

  /**
   * Clear overlay canvas
   */
  function clearOverlay() {
    if (overlayCanvas.value) {
      const ctx = overlayCanvas.value.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height);
      console.log('Overlay canvas cleared');
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
