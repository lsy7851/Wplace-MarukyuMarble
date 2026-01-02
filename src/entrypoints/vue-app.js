/**
 * Vue App - MAIN World Unlisted Script
 * @description Runs Vue app in MAIN world (page context) for Vue DevTools detection
 */

/**
 * Vue App - MAIN World Unlisted Script
 *
 * NOTE: This imports App.vue here for execution in MAIN world.
 * CSS is extracted to assets/vue-app.css but will be manually injected by content.js
 */
import { defineUnlistedScript } from 'wxt/sandbox';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';  // ✅ Import App component here for MAIN world execution

export default defineUnlistedScript(() => {
  'use strict';

  console.log('🎨 [MAIN/VueApp] Initializing Vue app in MAIN world...');

  // ===== DOM이 준비될 때까지 대기 =====
  function waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('📄 [MAIN/VueApp] DOMContentLoaded');
          resolve();
        }, { once: true });
      } else {
        console.log('📄 [MAIN/VueApp] DOM already ready');
        resolve();
      }
    });
  }

  // ===== Vue App 초기화 =====
  async function initVueApp() {
    await waitForDOMReady();

    console.log('🎨 [MAIN/VueApp] Mounting Vue app...');
    console.log('💡 [MAIN/VueApp] CSS already loaded via manifest injection');

    // Vue app container 생성
    const container = document.createElement('div');
    container.id = 'wxt-my-overlay';
    document.body.appendChild(container);

    // Pinia 생성
    const pinia = createPinia();

    // Vue app 생성
    const app = createApp(App);
    app.use(pinia);
    // 개발 모드에서 Vue DevTools 활성화
    if (import.meta.env.DEV) {
      app.config.devtools = true;
      app.config.performance = true;
      console.log('🔧 [MAIN/VueApp] Vue DevTools enabled - should be detected by browser extension!');
    }

    // 마운트
    app.mount(container);

    console.log('✅ [MAIN/VueApp] Vue app mounted successfully');
    console.log('💡 [MAIN/VueApp] Check for Vue DevTools in browser extension!');
    console.log('📨 [MAIN/VueApp] API message handling is now managed by useApiMessages composable in App.vue');
  }

  // Vue App 초기화 실행
  initVueApp().catch(err => {
    console.error('❌ [MAIN/VueApp] Failed to initialize Vue app:', err);
  });
});
