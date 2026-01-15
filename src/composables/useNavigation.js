/**
 * Navigation Composable
 * Handles navigation to locations on Wplace.live canvas
 */
import { buildWplaceUrl, tileToLatLng } from '@/utils/coordinates.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { storeToRefs } from 'pinia';

/**
 * Use navigation
 */
export function useNavigation() {
  const settingsStore = useSettingsStore();
  const { navigationMethod } = storeToRefs(settingsStore);

  /**
   * Send message to MAIN world
   * @param {string} type - Message type
   * @param {Object} data - Message data
   */
  function sendToMain(type, data) {
    window.postMessage({
      source: 'marukyu-marble-isolated',
      type: type,
      data: data,
      timestamp: Date.now()
    }, '*');
  }

  /**
   * Wait for response from MAIN world
   * @param {string} expectedType - Expected message type
   * @param {number} [timeout=5000] - Timeout in ms
   * @returns {Promise<Object>} Response data
   */
  function waitForMainResponse(expectedType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error(`Timeout waiting for ${expectedType}`));
      }, timeout);

      function handler(event) {
        if (event.source !== window) return;
        if (event.data.source !== 'marukyu-marble-main') return;
        if (event.data.type !== expectedType) return;

        clearTimeout(timeoutId);
        window.removeEventListener('message', handler);
        resolve(event.data.data);
      }

      window.addEventListener('message', handler);
    });
  }

  /**
   * Check if map is ready in MAIN world
   * @returns {Promise<boolean>}
   */
  async function isMapReady() {
    try {
      sendToMain('GET_MAP_STATUS', {});
      const status = await waitForMainResponse('MAP_STATUS', 2000);
      return status.isReady;
    } catch {
      return false;
    }
  }

  /**
   * Fly to location using MapLibre GL in MAIN world
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} [zoom=13.62] - Zoom level
   */
  async function flyToLocation(lat, lng, zoom = 13.62) {
    try {
      // Send flyTo request to MAIN world
      sendToMain('FLY_TO', { lat, lng, zoom });

      // Wait for success or error response
      await Promise.race([
        waitForMainResponse('FLY_TO_SUCCESS', 5000),
        waitForMainResponse('FLY_TO_ERROR', 5000).then(error => {
          throw new Error(error.error || 'FlyTo failed');
        })
      ]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Navigate to location by changing URL
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} [zoom=13.62] - Zoom level
   */
  function navigateByUrl(lat, lng, zoom = 13.62) {
    try {
      const url = buildWplaceUrl(lat, lng, zoom);
      window.location.href = url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Navigate to location
   * Uses navigation method from settings or specified in options
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} [zoom=13.62] - Zoom level
   * @param {Object} [options] - Navigation options
   * @param {string} [options.method] - Navigation method override: 'flyTo', 'url', or 'auto'
   */
  async function navigateToLocation(lat, lng, zoom = 13.62, options = {}) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Invalid coordinates');
    }

    // Get method from options or settings
    let method = options.method;
    if (!method) {
      // Use navigation method from settings
      method = navigationMethod.value; // 'flyto' or 'openurl'
    }

    try {
      if (method === 'openurl') {
        // URL navigation
        navigateByUrl(lat, lng, zoom);
      } else if (method === 'flyto') {
        // FlyTo navigation
        await flyToLocation(lat, lng, zoom);
      } else {
        // Auto: Try flyTo, fall back to URL
        try {
          await flyToLocation(lat, lng, zoom);
        } catch {
          navigateByUrl(lat, lng, zoom);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Navigate to Wplace tile coordinates
   * Converts tile coordinates to WGS84 and navigates
   * @param {Array} coords - [tileX, tileY, pixelX, pixelY]
   * @param {number} [zoom=13.62] - Zoom level
   * @param {Object} [options] - Navigation options
   */
  async function flyToCoordinates(coords, zoom = 13.62, options = {}) {
    if (!Array.isArray(coords) || coords.length !== 4) {
      throw new Error('Invalid coordinates array. Expected [tileX, tileY, pixelX, pixelY]');
    }

    const [tileX, tileY, pixelX, pixelY] = coords;

    // Convert Wplace coordinates to WGS84
    const { lat, lng } = tileToLatLng(tileX, tileY, pixelX, pixelY);

    // Navigate to location
    await navigateToLocation(lat, lng, zoom, options);
  }

  return {
    navigateToLocation,
    flyToLocation,
    flyToCoordinates,
    navigateByUrl,
    isMapReady,
  };
}
