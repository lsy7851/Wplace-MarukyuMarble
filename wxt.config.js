import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],

  extensionApi: 'chrome',
  srcDir: 'src',

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
    ],
    web_accessible_resources: [
      {
        resources: ['*.css', '*.js'],
        matches: ['*://*.wplace.live/*'],
      },
    ],
  },
});
