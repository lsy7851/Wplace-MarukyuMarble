import { defineConfig } from 'wxt';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],

  extensionApi: 'chrome',
  srcDir: 'src',

  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './src'),
        '@@': path.resolve(__dirname, '.'),
        '~~': path.resolve(__dirname, '.'),
      },
    },
  }),

  manifest: {
    name: '⑨ Marukyu Marble',
    description: 'Wplace.live template overlay tool. Named after Marukyu from Touhou Project. Fan-made derivative work.',
    version: '0.91.2',
    permissions: [
      'storage',
    ],
    host_permissions: [
      '*://*.wplace.live/*',
      '*://*.wplace.lol/*',
      '*://nominatim.openstreetmap.org/*',
    ],
    web_accessible_resources: [
      {
        // MAIN world unlisted scripts:
        // - api-interceptor.js: Intercepts fetch for API data
        // - vue-app.js: Vue app running in MAIN world for Vue DevTools detection
        // WXT automatically makes unlisted scripts web accessible
        resources: ['api-interceptor.js', 'vue-app.js', '*.css', '*.js'],
        matches: ['*://*.wplace.live/*', '*://*.wplace.lol/*'],
      },
    ],
  },
});
