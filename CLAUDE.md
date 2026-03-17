# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Marukyu Marble** is a Chrome extension (WXT + Vue 3) for Wplace.live that overlays pixel art templates on a collaborative canvas.

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Development build with hot reload
pnpm dev:firefox      # Firefox development build
pnpm build            # Production build
pnpm build:firefox    # Firefox production build
pnpm zip              # Create extension zip for distribution
pnpm format           # Format src/ with Prettier
pnpm format:check     # Check formatting without writing
```

**Load in Chrome**: Open `chrome://extensions/`, enable Developer mode, Load unpacked → `.output/chrome-mv3/`

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

- **ISOLATED world** (`src/entrypoints/content.js`): Injects scripts/CSS, proxies `chrome.storage` requests
- **MAIN world**: `api-interceptor.js` intercepts Wplace API calls, `vue-app.js` runs the Vue application
- **Storage compatibility**: `src/utils/storageCompat.js` provides `chrome.storage`-like API for MAIN world. All stores must use `chromeStorageCompat` instead of `chrome.storage` directly.

### State Management (Pinia Stores)

| Store | Purpose |
|-------|---------|
| `templateStore` | Template CRUD, enabled/disabled state |
| `settingsStore` | User preferences (synced via `chrome.storage.sync`), delegates to `stores/settings/` sub-modules |
| `userStore` | User info from intercepted API |
| `colorFilterStore` | Active color filters |
| `coordinateStore` | Current tile/pixel coordinates |
| `statusStore` | Volatile status messages (NOT persisted) |

### Data Flow (Template Rendering)

```
1. Wplace calls /api/tile → 2. api-interceptor intercepts fetch
3. TILE_RENDER_REQUEST → 4. Vue app's useTemplateRenderer
5. Draw on OffscreenCanvas (3x scale) → 6. Apply error map/color filter
7. TILE_PROCESSED → 8. Return modified blob to Wplace
```

### Storage Layers

- **`chrome.storage.sync`**: Settings (cross-device sync)
- **IndexedDB** (`useIndexedDB`): Large template tile blobs
- **LRU Memory Cache** (`useTileCache`): Up to 500 tiles in memory

## Key Files

| File | Purpose |
|------|---------|
| `src/entrypoints/content.js` | ISOLATED world entry, CSS/script injection |
| `src/entrypoints/api-interceptor.js` | MAIN world, fetch interception |
| `src/entrypoints/vue-app.js` | Vue app initialization |
| `src/models/Template.js` | Template class with serialization |
| `wxt.config.js` | WXT framework configuration |

### Composables Directory Structure

```
src/composables/
├── rendering/                    # Tile rendering pipeline
│   ├── useTemplateRenderer.js    # Orchestrator: cache, matching, pipeline
│   ├── useEnhancedRendering.js   # Crosshair/color highlight rendering
│   ├── usePixelProgress.js       # Pixel progress counting
│   └── useErrorMap.js            # Error map overlay
├── storage/                      # Data persistence
│   ├── useIndexedDB.js           # IndexedDB tile storage
│   └── useTileCache.js           # LRU memory cache
├── features/                     # Feature-specific composables
│   ├── useColorFilter.js         # Color filter UI logic (shared singleton)
│   ├── useImportExport.js        # Template JSON import/export
│   ├── useImageProcessing.js     # Image chunking
│   ├── useScreenshot.js          # Screenshot capture
│   └── useProgressTracking.js    # Progress aggregation
└── ui/                           # UI interaction
    ├── useApiMessages.js          # postMessage handlers
    ├── useCanvasOverlay.js        # MapLibre overlay
    ├── useChargeTimer.js          # Charge countdown
    └── useNavigation.js           # Map navigation
```

### Settings Store Structure

```
src/stores/settings/
├── storageKeys.js           # STORAGE_KEYS and DEFAULTS constants
├── crosshairSettings.js     # Crosshair color, border, size, radius
├── uiSettings.js            # UI toggles, visibility, nav, sorting
├── performanceSettings.js   # Tile refresh, smart cache, detection
└── errorMapSettings.js      # Error map, wrong colors display
```

`settingsStore.js` is the composition root that delegates to these sub-modules while maintaining the same public API.

## Coordinate System

- **Tile coords**: `[tileX, tileY]` (0-2047 range)
- **Pixel coords**: `[pixelX, pixelY]` (0-999 within tile)
- **Canvas**: 1000×1000 pixels per tile, rendered at 3× (3000×3000 OffscreenCanvas)
- Utilities in `src/utils/coordinates.js`

## Conventions

- Vue 3 Composition API with `<script setup>`
- Pinia stores use setup syntax (not options)
- Composables prefix: `use*` (e.g., `useTemplateRenderer`)
- Path aliases: `@/` and `~/` both resolve to `src/`
- All `src/` internal imports use `@/` alias (no relative `./` between composable siblings)
- Storage keys prefix: `mm*` (Marukyu Marble)
- Code formatting: Prettier (config in `.prettierrc`)
