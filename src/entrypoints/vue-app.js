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
import { createApp, devtools } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';  // ✅ Import App component here for MAIN world execution
import { useUserStore } from '@/stores/userStore.js';

export default defineUnlistedScript(() => {
  'use strict';

  const EXTENSION_NAME = 'Marukyu Marble';
  const MESSAGE_SOURCE_TO_ISOLATED = 'marukyu-marble-main-vueapp';
  const MESSAGE_SOURCE_FROM_INTERCEPTOR = 'marukyu-marble-main';

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

    // Store 인스턴스
    const userStore = useUserStore();

    console.log('✅ [MAIN/VueApp] Vue app mounted successfully');
    console.log('💡 [MAIN/VueApp] Check for Vue DevTools in browser extension!');

    // ===== API Interceptor로부터 메시지 수신 =====
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      const message = event.data;

      // API interceptor로부터의 메시지 처리
      if (message.source === MESSAGE_SOURCE_FROM_INTERCEPTOR) {
        console.log('📨 [MAIN/VueApp] Received message from API interceptor:', message.type);

        switch (message.type) {
          case 'USER_INFO':
            console.log('👤 [MAIN/VueApp] Updating user info in store');
            userStore.setUserInfo(message.data);
            break;

          case 'USER_NOT_LOGGED_IN':
            console.warn('⚠️ [MAIN/VueApp] User not logged in');
            userStore.clearUserInfo();
            break;

          case 'PIXEL_DATA':
            console.log('🎨 [MAIN/VueApp] Pixel data received:', message.data);
            // TODO: 픽셀 클릭 처리
            break;

          case 'TILE_DATA':
            console.log('🗺️ [MAIN/VueApp] Tile data received');
            // TODO: 타일 캐싱 처리
            break;

          default:
            console.warn('⚠️ [MAIN/VueApp] Unknown message type:', message.type);
        }
      }
    });

    console.log('✅ [MAIN/VueApp] Message listener registered');
  }

  // Vue App 초기화 실행
  initVueApp().catch(err => {
    console.error('❌ [MAIN/VueApp] Failed to initialize Vue app:', err);
  });
});
