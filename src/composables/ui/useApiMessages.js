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
 * API Messages Composable
 * Receives messages from API Interceptor (MAIN world) and distributes to appropriate stores
 */
import { onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/userStore.js';
import { useCoordinateStore } from '@/stores/coordinateStore.js';
import { useServerStore } from '@/stores/serverStore.js';
import { useTemplateRenderer } from '@/composables/rendering/useTemplateRenderer';

const MESSAGE_SOURCE = 'marukyu-marble-main';

/**
 * Setup API message listener
 * Distributes incoming messages from API Interceptor to appropriate stores
 */
export function useApiMessages() {
  const userStore = useUserStore();
  const coordStore = useCoordinateStore();
  const serverStore = useServerStore();
  const renderer = useTemplateRenderer();

  /**
   * Handle incoming messages from MAIN world API Interceptor
   * @param {MessageEvent} event
   */
  function handleMessage(event) {
    // Security: Only process messages from same window
    if (event.source !== window) return;

    const message = event.data;

    // Only process messages from our API Interceptor
    if (message.source !== MESSAGE_SOURCE) return;

    const { type, data, timestamp } = message;

    // Distribute message to appropriate store
    switch (type) {
      case 'INTERCEPTOR_READY':
        break;

      case 'USER_INFO':
        handleUserInfo(data);
        break;

      case 'USER_NOT_LOGGED_IN':
        handleUserNotLoggedIn(data);
        break;

      case 'PIXEL_DATA':
        handlePixelData(data);
        break;

      case 'TILE_SERVER_DETECTED':
        handleTileServerDetected(data);
        break;

      case 'TILE_RENDER_REQUEST':
        handleTileRenderRequest(message);
        break;

      default:
        break;
    }
  }

  /**
   * Handle USER_INFO message
   * @param {Object} data
   */
  function handleUserInfo(data) {
    userStore.setUserInfo({
      id: data.id,
      name: data.name,
      level: data.level,
      pixelsPainted: data.pixelsPainted,
      droplets: data.droplets,
      charges: data.charges,
      maxCharges: data.maxCharges,
      nextChargeTime: data.nextChargeTime,
      cooldownMs: data.cooldownMs,
      canPaint: data.canPaint,
    });
  }

  /**
   * Handle USER_NOT_LOGGED_IN message
   * @param {Object} data
   */
  function handleUserNotLoggedIn() {
    userStore.clearUserInfo();
  }

  /**
   * Handle PIXEL_DATA message (coordinate detection)
   * @param {Object} data
   */
  function handlePixelData(data) {
    coordStore.setCoords({
      tileX: data.tileX,
      tileY: data.tileY,
      pixelX: data.pixelX,
      pixelY: data.pixelY,
    });
  }

  /**
   * Handle TILE_RENDER_REQUEST message from API interceptor
   * @param {Object} message - { blobID, tileX, tileY, blob }
   */
  async function handleTileRenderRequest(message) {
    const { blobID, tileX, tileY, blob } = message;

    try {
      const processedBlob = await renderer.drawTemplateOnTile(blob, [tileX, tileY]);

      window.postMessage({
        source: MESSAGE_SOURCE,
        type: 'TILE_PROCESSED',
        blobID,
        processedBlob
      }, '*');
    } catch {
      // Return original blob on error
      window.postMessage({
        source: MESSAGE_SOURCE,
        type: 'TILE_PROCESSED',
        blobID,
        processedBlob: blob
      }, '*');
    }
  }

  /**
   * Handle TILE_SERVER_DETECTED message
   * @param {Object} data - { url }
   */
  function handleTileServerDetected(data) {
    if (data.url) {
      serverStore.setTileServerUrl(data.url);
    }
  }

  // Setup listener on component mount
  onMounted(() => {
    window.addEventListener('message', handleMessage);
  });

  // Cleanup listener on component unmount
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });

  return {
    // Expose for testing if needed
    handleMessage,
  };
}
