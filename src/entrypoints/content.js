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
    console.log('✅ [ISOLATED] Marukyu Marble Content Script starting...');

    // ===== 1. Wait for DOM head to be ready =====
    await waitForDocumentHead();
    console.log('📄 [ISOLATED] document.head is ready');

    // ===== 2. Manually inject CSS =====
    await injectVueCSS();
    console.log('🎨 [ISOLATED] Vue CSS injected manually');

    // ===== 3. Inject API Interceptor into MAIN world =====
    await injectAPIInterceptor();
    console.log('🎯 [ISOLATED] API interceptor injected - ready to catch /api/me');

    // ===== 4. Inject Vue App into MAIN world =====
    await injectVueApp();
    console.log('🎨 [ISOLATED] Vue app injected into MAIN world');
    console.log('💡 [ISOLATED] Vue DevTools should now detect the app!');

    // ===== 5. Setup chrome.storage proxy =====
    setupStorageProxy();
    console.log('🔌 [ISOLATED] Chrome.storage proxy active');

    console.log('✅ [ISOLATED] Marukyu Marble initialized');
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
        console.log('✅ [ISOLATED] Vue CSS loaded successfully');
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
 * Inject API Interceptor into MAIN world
 * Must run before Wplace.live JavaScript
 */
async function injectAPIInterceptor() {
  console.log('📥 [ISOLATED] Injecting API interceptor...');

  try {
    await injectScript('/api-interceptor.js', {
      keepInDom: true,
    });

    console.log('✅ [ISOLATED] API interceptor injected successfully');
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
  console.log('📥 [ISOLATED] Injecting Vue app into MAIN world...');


  try {
    await injectScript('/vue-app.js', {
      keepInDom: true,
    });

    console.log('✅ [ISOLATED] Vue app injected successfully');
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
  window.addEventListener('message', async (event) => {
    // 보안: 같은 window에서 온 메시지만 처리
    if (event.source !== window) return;

    const message = event.data;

    // Storage 요청만 처리
    if (message.source !== STORAGE_REQUEST_SOURCE) return;

    const { id, area, action, payload } = message;

    console.log(`🔌 [ISOLATED] Storage request: ${area}.${action}`, payload);

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

      console.log(`✅ [ISOLATED] Storage ${area}.${action} succeeded`);

    } catch (error) {
      // 에러 응답 전송
      window.postMessage({
        source: STORAGE_RESPONSE_SOURCE,
        id,
        success: false,
        error: error.message,
      }, '*');

      console.error(`❌ [ISOLATED] Storage ${area}.${action} failed:`, error);
    }
  });

  console.log('🔌 [ISOLATED] Chrome.storage proxy listener registered');
}
