/**
 * Marukyu Marble - WXT Content Script (ISOLATED World)
 *
 * ISOLATED world content script that:
 * 1. Manually injects Vue app CSS (assets/vue-app.css)
 * 2. Injects API interceptor into MAIN world
 * 3. Injects Vue app into MAIN world (for Vue DevTools detection)
 * 4. Proxies chrome.storage API for MAIN world via postMessage
 *
 * CSS Handling:
 * - Vue app (vue-app.js) imports App.vue, generating assets/vue-app.css
 * - This content script manually injects that CSS using chrome.runtime.getURL
 * - CSS is loaded before Vue app runs, ensuring styles are applied
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

    // ===== Wait for DOM head to be ready =====
    await waitForDocumentHead();

    // ===== Manually inject CSS =====
    await injectVueCSS();

    // ===== Inject Vue App into MAIN world =====
    await injectVueApp();
  },
});

/**
 * Wait for document.head to be available
 * Needed because runAt: 'document_start' runs before DOM is ready
 */
function waitForDocumentHead() {
  return new Promise((resolve) => {
    if (document.head) {
      resolve();
    } else {
      const observer = new MutationObserver(() => {
        if (document.head) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  });
}

/**
 * Manually inject Vue CSS
 * ISOLATED world can use chrome.runtime.getURL to load extension resources
 */
function injectVueCSS() {
  return new Promise((resolve, reject) => {
    try {
      const cssUrl = chrome.runtime.getURL('assets/vue-app.css');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      link.onload = () => {
        resolve();
      };
      link.onerror = () => {
        console.error('❌ [ISOLATED] Failed to load Vue CSS');
        reject(new Error('CSS load failed'));
      };
      document.head.appendChild(link);
    } catch (error) {
      console.error('❌ [ISOLATED] Failed to inject CSS:', error);
      reject(error);
    }
  });
}

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
    console.error('❌ [ISOLATED] Failed to inject API interceptor:', error);
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
    console.error('❌ [ISOLATED] Failed to inject Vue app:', error);
    throw error;
  }
}

/**
 * Setup chrome.storage proxy for MAIN world
 * MAIN world cannot access chrome.* APIs, so we proxy requests via postMessage
 */
function setupStorageProxy() {
  console.log('🔧 [ISOLATED] Storage proxy initialized');

  window.addEventListener('message', async (event) => {
    // 보안: 같은 window에서 온 메시지만 처리
    if (event.source !== window) return;

    const message = event.data;

    // Storage 요청만 처리
    if (message.source !== STORAGE_REQUEST_SOURCE) return;

    const { id, area, action, payload } = message;

    console.log(`📥 [ISOLATED] Received storage request #${id}: ${area}.${action}`, payload);

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
      console.log(`📤 [ISOLATED] Sending response #${id}: SUCCESS`, result);
      window.postMessage({
        source: STORAGE_RESPONSE_SOURCE,
        id,
        success: true,
        data: result,
      }, '*');

    } catch (error) {
      // 에러 응답 전송
      console.error(`❌ [ISOLATED] Storage ${area}.${action} failed:`, error);
      window.postMessage({
        source: STORAGE_RESPONSE_SOURCE,
        id,
        success: false,
        error: error.message,
      }, '*');
    }
  });
}
