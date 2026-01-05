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

  // ===== MapLibre GL 맵 초기화 =====
  function findMapInstance() {
    // 방법 1: 기존 DOM selector 방식
    try {
      const element = document.querySelector("div.absolute.bottom-3.right-3.z-30");
      if (element) {
        const map = element.childNodes[0]?.__click?.[3]?.v;
        if (map && typeof map.version === 'string' && typeof map.flyTo === 'function') {
          console.log('✅ Found map via DOM selector');
          return map;
        }
      }
    } catch (e) {}

    // 방법 2: Canvas 요소에서 찾기
    try {
      const canvas = document.querySelector('canvas.maplibregl-canvas');
      if (canvas) {
        // Canvas의 부모 요소들을 순회하며 map 인스턴스 찾기
        let parent = canvas.parentElement;
        while (parent) {
          const keys = Object.keys(parent);
          for (const key of keys) {
            if (key.startsWith('__reactProps') || key.startsWith('__vueParentComponent')) {
              const props = parent[key];
              if (props && props.map && typeof props.map.flyTo === 'function') {
                console.log('✅ Found map via canvas parent props');
                return props.map;
              }
            }
          }
          parent = parent.parentElement;
        }
      }
    } catch (e) {}

    // 방법 3: 이미 window.mmmap이 설정되어 있는지 확인
    if (window.mmmap && typeof window.mmmap.flyTo === 'function') {
      console.log('✅ Map already exists in window.mmmap');
      return window.mmmap;
    }

    // 방법 4: window 객체에서 MapLibre 인스턴스 찾기
    try {
      for (const key of Object.keys(window)) {
        const obj = window[key];
        if (obj && typeof obj === 'object' && typeof obj.flyTo === 'function' && typeof obj.version === 'string') {
          console.log('✅ Found map in window.' + key);
          return obj;
        }
      }
    } catch (e) {}

    return null;
  }

  function initializeMapReference() {
    console.log('🗺️ [MAIN/VueApp] Setting up map observer...');

    let attemptCount = 0;

    const observer = new MutationObserver(() => {
      attemptCount++;

      if (attemptCount % 100 === 0) {
        console.log(`🔍 [MAIN/VueApp] Map search attempt ${attemptCount}`);
      }

      const map = findMapInstance();

      if (map) {
        window.mmmap = map;
        observer.disconnect();
        console.log('✅ [MAIN/VueApp] MapLibre GL map initialized after', attemptCount, 'attempts');
        console.log('✅ Map version:', map.version);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('🗺️ [MAIN/VueApp] Map observer started');

    // 즉시 한 번 시도
    setTimeout(() => {
      const map = findMapInstance();
      if (map) {
        window.mmmap = map;
        observer.disconnect();
        console.log('✅ [MAIN/VueApp] Map found immediately');
      }
    }, 1000);
  }

  // ===== Vue App 초기화 =====
  async function initVueApp() {
    await waitForDOMReady();

    console.log('🎨 [MAIN/VueApp] Mounting Vue app...');
    console.log('💡 [MAIN/VueApp] CSS already loaded via manifest injection');

    // 맵 초기화 시작 (비동기, 백그라운드에서 실행)
    initializeMapReference();

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
