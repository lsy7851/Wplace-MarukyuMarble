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
 * Chrome Storage Compatibility Layer for MAIN World
 *
 * MAIN world에서는 chrome.* API를 사용할 수 없으므로
 * postMessage를 통해 ISOLATED world에 storage 요청을 전달
 */

const MESSAGE_SOURCE = 'marukyu-marble-main-storage';
const RESPONSE_SOURCE = 'marukyu-marble-isolated-storage';

let requestId = 0;
const pendingRequests = new Map();

// ISOLATED world로부터의 응답 수신
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.source !== RESPONSE_SOURCE) return;

  const { id, success, data, error } = event.data;

  const pending = pendingRequests.get(id);
  if (!pending) {
    return;
  }

  pendingRequests.delete(id);

  if (success) {
    pending.resolve(data);
  } else {
    pending.reject(new Error(error));
  }
});

/**
 * ISOLATED world로 storage 요청 전송
 * @param {string} area - Storage area ('local' or 'sync')
 * @param {string} action - Action to perform ('get', 'set', 'remove', 'clear')
 * @param {Object} payload - Request payload
 */
function sendStorageRequest(area, action, payload) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;

    pendingRequests.set(id, { resolve, reject });

    window.postMessage({
      source: MESSAGE_SOURCE,
      id,
      area,
      action,
      payload
    }, '*');

    // Timeout (10s)
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Storage request timeout'));
      }
    }, 10000);
  });
}

/**
 * Chrome Storage API 호환 레이어
 */
export const chromeStorageCompat = {
  local: {
    /**
     * Get items from storage
     * @param {string|string[]|null} keys - Key(s) to retrieve
     * @returns {Promise<Object>}
     */
    async get(keys) {
      return sendStorageRequest('local', 'get', { keys });
    },

    /**
     * Set items in storage
     * @param {Object} items - Key-value pairs to set
     * @returns {Promise<void>}
     */
    async set(items) {
      return sendStorageRequest('local', 'set', { items });
    },

    /**
     * Remove items from storage
     * @param {string|string[]} keys - Key(s) to remove
     * @returns {Promise<void>}
     */
    async remove(keys) {
      return sendStorageRequest('local', 'remove', { keys });
    },

    /**
     * Clear all items from storage
     * @returns {Promise<void>}
     */
    async clear() {
      return sendStorageRequest('local', 'clear', {});
    }
  },

  sync: {
    /**
     * Get items from sync storage
     * @param {string|string[]|null} keys - Key(s) to retrieve
     * @returns {Promise<Object>}
     */
    async get(keys) {
      return sendStorageRequest('sync', 'get', { keys });
    },

    /**
     * Set items in sync storage
     * @param {Object} items - Key-value pairs to set
     * @returns {Promise<void>}
     */
    async set(items) {
      return sendStorageRequest('sync', 'set', { items });
    },

    /**
     * Remove items from sync storage
     * @param {string|string[]} keys - Key(s) to remove
     * @returns {Promise<void>}
     */
    async remove(keys) {
      return sendStorageRequest('sync', 'remove', { keys });
    },

    /**
     * Clear all items from sync storage
     * @returns {Promise<void>}
     */
    async clear() {
      return sendStorageRequest('sync', 'clear', {});
    }
  }
};
