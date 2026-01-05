/**
 * API Messages Composable
 * Receives messages from API Interceptor (MAIN world) and distributes to appropriate stores
 */
import { onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/userStore.js';
import { useCoordinateStore } from '@/stores/coordinateStore.js';

const MESSAGE_SOURCE = 'marukyu-marble-main';

/**
 * Setup API message listener
 * Distributes incoming messages from API Interceptor to appropriate stores
 */
export function useApiMessages() {
  const userStore = useUserStore();
  const coordStore = useCoordinateStore();

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

      case 'TILE_DATA':
        handleTileData(data);
        break;

      default:
        console.warn('⚠️ [useApiMessages] Unknown message type:', type);
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
  function handleUserNotLoggedIn(data) {
    console.warn('⚠️ [useApiMessages] User not logged in:', data.status);
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
   * Handle TILE_DATA message (tile images)
   * @param {Object} data
   */
  function handleTileData(data) {
    // TODO: Implement tileStore when needed
    console.log('🗺️ [useApiMessages] Tile data received (not yet implemented):', data.url);
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
