/**
 * Marukyu Marble - WXT Content Script
 *
 * Clean implementation for Chrome Extension
 */
import './style.css';
import { defineContentScript } from 'wxt/sandbox';
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: [ '*://*.wplace.live/*' ],
  cssInjectionMode: 'manifest',

  async main(ctx) {
    const ui = await createIntegratedUi(ctx, {
      name: 'marukyu-marble',
      position: 'overlay',
      anchor: 'body',
      isolateEvents: true,

      onMount(container) {
        const app = createApp(App);
        container.id = 'wxt-my-overlay'
        app.mount(container);
        return app;
      },
    });

    ui.mount();
  },
});
