/**
 * Marukyu Marble - WXT Content Script
 *
 * Clean implementation for Chrome Extension
 */
import './style.css';
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: [ '*://*.wplace.live/*' ],
  cssInjectionMode: 'ui',


  async main(ctx) {
    console.log('⑨ Marukyu Marble - Starting...');
    const ui = await createShadowRootUi(ctx, {
      name: 'marukyu-marble',
      // 화면 위에 얹는 용도면 보통 overlay / modal 중 선택
      position: 'overlay',

      // Shadow host를 어디에 붙일지 (대부분 body)
      anchor: 'body',

      // (선택) 이벤트 격리: 페이지 클릭 핸들러랑 충돌 줄이기
      isolateEvents: true,

      onMount(container) {
        console.log('⑨ Initializing UI...');
        // Create simple overlay
        const overlay = document.createElement('div');
        overlay.className = 'marukyu-overlay';
        overlay.innerHTML = `
          <h3>⑨ Marukyu Marble</h3>
          <p>Template overlay tool</p>
        `;
// Add event listener
        const testBtn = document.createElement('button');
        testBtn.id = 'marukyu-test-btn';
        testBtn.textContent = 'Test Button';
        testBtn.addEventListener('click', () => {
          alert('⑨ Marukyu Marble is working!');
          console.log('⑨ Button clicked');
        });

        overlay.appendChild(testBtn);
        container.appendChild(overlay);
      },
    });

    ui.mount();
    console.log('⑨ Marukyu Marble - Initialized successfully!');
  },
});
