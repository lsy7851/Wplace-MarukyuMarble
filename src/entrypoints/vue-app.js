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
import { chromeStorageCompat } from '@/utils/storageCompat';

export default defineUnlistedScript(() => {
  'use strict';

  // ===== Setup chrome.storage polyfill using existing compatibility layer =====
  if (!window.chrome) {
    window.chrome = {};
  }

  if (!window.chrome.storage) {
    window.chrome.storage = chromeStorageCompat;
  }

  // ===== DOM이 준비될 때까지 대기 =====
  function waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          resolve();
        }, { once: true });
      } else {
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
      return window.mmmap;
    }

    // 방법 4: window 객체에서 MapLibre 인스턴스 찾기
    try {
      for (const key of Object.keys(window)) {
        const obj = window[key];
        if (obj && typeof obj === 'object' && typeof obj.flyTo === 'function' && typeof obj.version === 'string') {
          return obj;
        }
      }
    } catch (e) {}

    return null;
  }

  function initializeMapReference() {
    const observer = new MutationObserver(() => {
      const map = findMapInstance();

      if (map) {
        window.mmmap = map;
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 즉시 한 번 시도
    setTimeout(() => {
      const map = findMapInstance();
      if (map) {
        window.mmmap = map;
        observer.disconnect();
      }
    }, 1000);
  }

  // ===== Vue App 초기화 =====
  async function initVueApp() {
    await waitForDOMReady();

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
    }

    // 마운트
    app.mount(container);
  }

  // Vue App 초기화 실행
  initVueApp().catch(() => {
    // Initialization error silently ignored
  });
});
