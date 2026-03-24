# CLAUDE.md

## Project Overview

**Marukyu Marble** is a Chrome extension (WXT + Vue 3) for Wplace.live that overlays pixel art templates on a collaborative canvas.

## Architecture

### Dual World System (Chrome Extension Isolation)

The extension runs in two isolated JavaScript contexts that communicate via `postMessage`:

```
ISOLATED World (content.js)          MAIN World (api-interceptor.js, vue-app.js)
├── chrome.* API access              ├── Page's window access
├── CSS injection                    ├── fetch() interception
├── Storage proxy for MAIN world     ├── Vue app + Pinia stores
└── Message relay                    └── Canvas overlay rendering
```

- **Storage compatibility**: All stores must use `chromeStorageCompat` (`src/utils/storageCompat.js`) instead of `chrome.storage` directly.

### Storage Layers

- **`chrome.storage.sync`**: Settings (cross-device sync)
- **IndexedDB**: Large template tile blobs
- **LRU Memory Cache**: Hot tiles in memory

### Settings Store Delegation

`settingsStore.js` is a composition root that delegates to `stores/settings/` sub-modules. Settings sub-modules should not be imported directly by components.

## Coordinate System

- **Tile coords**: `[tileX, tileY]` (0-2047 range)
- **Pixel coords**: `[pixelX, pixelY]` (0-999 within tile)
- **Canvas**: 1000×1000 pixels per tile, rendered at 3× (3000×3000 OffscreenCanvas)

## Conventions

- All `src/` internal imports use `@/` alias (no relative `./` between composable siblings)
- Storage keys prefix: `mm*` (Marukyu Marble)