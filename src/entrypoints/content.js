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
 * Marukyu Marble - WXT Content Script (ISOLATED World)
 *
 * ISOLATED world content script that:
 * 1. Injects API interceptor into MAIN world
 * 2. Injects Vue app into MAIN world (for Vue DevTools detection)
 * 3. Proxies chrome.storage API for MAIN world via postMessage
 *
 * CSS is loaded by vue-app.js directly into Shadow DOM for style isolation.
 */
import { defineContentScript } from 'wxt/sandbox';
import { injectScript } from 'wxt/client';

const STORAGE_REQUEST_SOURCE = 'marukyu-marble-main-storage';
const STORAGE_RESPONSE_SOURCE = 'marukyu-marble-isolated-storage';

export default defineContentScript({
  matches: [ '*://*.wplace.live/*' ],
  cssInjectionMode: 'manual',
  runAt: 'document_start',

  async main(ctx) {
    // ===== CRITICAL: Inject API Interceptor IMMEDIATELY =====
    // Must run before Wplace.live scripts execute to catch /api/me
    await injectAPIInterceptorImmediate();

    // ===== Setup chrome.storage proxy immediately =====
    setupStorageProxy();

    // ===== Inject Vue App into MAIN world =====
    // CSS is now loaded by vue-app.js into Shadow DOM (no longer injected here)
    await injectVueApp();
  },
});

/**
 * Inject API Interceptor into MAIN world IMMEDIATELY
 * Uses document.documentElement instead of document.head for earliest possible injection
 * Must run before Wplace.live JavaScript to catch /api/me
 */
async function injectAPIInterceptorImmediate() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('api-interceptor.js');
    script.type = 'module';

    // Inject into documentElement (available at document_start)
    // This is earlier than waiting for document.head
    (document.documentElement || document.head || document.body).appendChild(script);
  } catch (error) {
    throw error;
  }
}

/**
 * Inject Vue App into MAIN world
 * This allows Vue DevTools browser extension to detect the app
 */
async function injectVueApp() {
  try {
    await injectScript('/vue-app.js', {
      keepInDom: true,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Setup chrome.storage proxy for MAIN world
 * MAIN world cannot access chrome.* APIs, so we proxy requests via postMessage
 */
function setupStorageProxy() {
  window.addEventListener('message', async (event) => {
    // 보안: 같은 window에서 온 메시지만 처리
    if (event.source !== window) return;

    const message = event.data;

    // Storage 요청만 처리
    if (message.source !== STORAGE_REQUEST_SOURCE) return;

    const { id, area, action, payload } = message;

    try {
      let result;

      // Select storage area (local or sync)
      const storageArea = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

      switch (action) {
        case 'get': {
          const { keys } = payload;
          result = await storageArea.get(keys);
          break;
        }

        case 'set': {
          const { items } = payload;
          await storageArea.set(items);
          result = undefined;
          break;
        }

        case 'remove': {
          const { keys } = payload;
          await storageArea.remove(keys);
          result = undefined;
          break;
        }

        case 'clear': {
          await storageArea.clear();
          result = undefined;
          break;
        }

        default:
          throw new Error(`Unknown storage action: ${action}`);
      }

      // 성공 응답 전송
      window.postMessage({
        source: STORAGE_RESPONSE_SOURCE,
        id,
        success: true,
        data: result,
      }, '*');

    } catch (error) {
      // 에러 응답 전송
      window.postMessage({
        source: STORAGE_RESPONSE_SOURCE,
        id,
        success: false,
        error: error.message,
      }, '*');
    }
  });
}
