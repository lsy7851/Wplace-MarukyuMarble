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
import { Template } from '@/models/Template';
import { useTemplateStore } from '@/stores/templateStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIndexedDB } from './useIndexedDB';
import { useTileCache } from './useTileCache';
import { useErrorMap } from './useErrorMap';

/**
 * Template rendering composable
 *
 * Handles real-time rendering of templates on canvas tiles
 * Integrates with useTileCache for LRU caching and pause functionality
 *
 * Reference: old-src/templateManager.js:487-1310
 * Reference: old-src/tileManager.js:249-365 (cache integration)
 */
export function useTemplateRenderer() {
  const templateStore = useTemplateStore();
  const settingsStore = useSettingsStore();
  const db = useIndexedDB();
  const tileCache = useTileCache();
  const errorMap = useErrorMap();

  /**
   * Core rendering function (without cache)
   * This is the actual rendering logic, called when cache misses
   * @param {Blob} tileBlob - Canvas tile from Wplace API
   * @param {[number, number]} tileCoords - [tileX, tileY]
   * @returns {Promise<Blob>} Modified tile with templates overlaid
   */
  async function renderTileCore(tileBlob, tileCoords) {
    const [tileX, tileY] = tileCoords;
    const tileSize = Template.TILE_SIZE;
    const drawMult = Template.SHREAD_SIZE;

    // STEP 1: Find matching templates
    const matchingTemplates = await findMatchingTemplates(tileX, tileY);

    if (matchingTemplates.length === 0) {
      return tileBlob;
    }

    // STEP 2: Create canvas
    const canvas = new OffscreenCanvas(
      tileSize * drawMult,  // 3000×3000
      tileSize * drawMult
    );
    const ctx = canvas.getContext('2d');

    // Disable image smoothing for pixel-perfect rendering (no anti-aliasing)
    ctx.imageSmoothingEnabled = false;

    // Draw base tile from server
    const baseBitmap = await createImageBitmap(tileBlob);
    // Scale base tile to match canvas size (3000x3000)
    // This ensures templates overlay at correct scale
    ctx.drawImage(baseBitmap, 0, 0, canvas.width, canvas.height);

    // Get canvas pixel data for comparison
    const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // STEP 2: Draw templates (Legacy: templateManager.js:619 loop)
    // We strictly replicate the legacy "Bad Design" where the loop index determines
    // which filter settings to use, causing an "Index Mismatch" effect.
    for (let i = 0; i < matchingTemplates.length; i++) {
      const { template: matchedTemplate, tileKey: matchedTileKey, coords: matchedCoords } = matchingTemplates[i];

      // The legacy code used the template from the global store based on the loop index,
      // and then calculated coords relative to the current tile.
      // We need to pass the actual template and its specific tileKey/coords for loading,
      // but the `renderTemplate` function will use the `loopIndex` to determine filter settings.
      await renderTemplate(ctx, canvasData, matchedTemplate, matchedTileKey, matchedCoords, tileCoords, i);
    }

    // STEP 4: Count pixels for progress tracking (using ORIGINAL tileBlob, not overlayed canvas)
    await countPixelProgress(ctx, tileBlob, matchingTemplates, tileCoords);

    // STEP 5: Apply error map if enabled
    if (settingsStore.errorMapEnabled) {

      // Create separate canvas for original tile data (for comparison)
      // We need fresh original tile data, not the template-overlayed canvas
      const originalCanvas = new OffscreenCanvas(
        tileSize * drawMult,
        tileSize * drawMult
      );
      const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
      originalCtx.imageSmoothingEnabled = false;

      // Re-draw original tile (baseBitmap was created earlier)
      originalCtx.drawImage(baseBitmap, 0, 0, originalCanvas.width, originalCanvas.height);

      // Apply error map for each template
      for (const { template, tileKey, coords } of matchingTemplates) {
        const templateTileBlob = await db.loadTile(template.id, tileKey);
        if (!templateTileBlob) continue;

        const templateBitmap = await createImageBitmap(templateTileBlob);

        const result = await errorMap.applyErrorMap(
          originalCtx,           // Original tile context for pixel comparison
          ctx,                   // Main context to draw error map overlay
          template,              // Template instance (for color filtering)
          templateBitmap,        // Template tile bitmap
          coords,                // Tile coordinates {tileX, tileY, pixelX, pixelY}
          tileSize * drawMult    // Canvas size (3000)
        );

      }
    }

    // Convert to blob
    return await canvas.convertToBlob({ type: 'image/png' });
  }

  /**
   * Main rendering function called for each tile update
   * Integrates with useTileCache for caching and pause functionality
   *
   * Reference: old-src/tileManager.js:261-294 (cache wrapper logic)
   *
   * @param {Blob} tileBlob - Canvas tile from Wplace API
   * @param {[number, number]} tileCoords - [tileX, tileY]
   * @returns {Promise<Blob>} Modified tile with templates overlaid
   */
  async function drawTemplateOnTile(tileBlob, tileCoords) {
    // Early return if no templates should be drawn (legacy: templateManager.js:490)
    if (!templateStore.templatesShouldBeDrawn) {
      return tileBlob;
    }

    // STEP 1: Check cache first (smart cache or frozen cache when paused)
    const cachedResult = tileCache.get(tileCoords, tileBlob);
    if (cachedResult) {
      return cachedResult;
    }

    // If paused and no frozen cache, return original blob (fallback)
    if (tileCache.paused.value) {
      return tileBlob;
    }

    // STEP 2: Cache miss - process tile with core renderer
    const result = await renderTileCore(tileBlob, tileCoords);

    // STEP 3: Store in cache for future use
    // Reference: old-src/tileManager.js:277-291
    tileCache.set(tileCoords, tileBlob, result);

    return result;
  }

  /**
   * Find templates that have tiles overlapping with current tile
   */
  async function findMatchingTemplates(tileX, tileY) {
    const matching = [];

    for (const template of templateStore.sortedTemplates) {
      if (!template.enabled) continue;

      // Check if this template has tiles overlapping current tile
      const templateTileKeys = await db.getTemplateTileKeys(template.id);

      for (const tileKey of templateTileKeys) {
        const coords = Template.parseTileKey(tileKey);
        if (coords.tileX === tileX && coords.tileY === tileY) {
          matching.push({ template, tileKey, coords });
        }
      }
    }

    return matching;
  }

  /**
   * Render a single template tile
   * @param {number} loopIndex - The index in the drawing loop (used for legacy filter mismatch)
   */
  async function renderTemplate(ctx, canvasData, template, tileKey, coords, tileCoords, loopIndex) {
    // Load template tile from IndexedDB
    const tileBlob = await db.loadTile(template.id, tileKey);
    if (!tileBlob) return;

    const templateBitmap = await createImageBitmap(tileBlob);

    // LEGACY BEHAVIOR ADJUSTMENT:
    // Strictly speaking, legacy used `templateArray[i]` (loopIndex).
    // However, this causes issues when templates overlap (i becomes 1, checking template[1] which has no settings).
    // To match the user's "Global Application" experience, we FORCE checking index 0 (the main template).
    const filterTemplate = templateStore.templates[0] || template;

    // Check if we need enhanced/filtered rendering using the FILTER template
    const hasEnhancedColors = filterTemplate.enhancedColors.size > 0;
    const hasDisabledColors = filterTemplate.disabledColors.size > 0;
    const enhanceWrongColors = settingsStore.enhanceWrongColors || false;


    if (!hasEnhancedColors && !hasDisabledColors && !enhanceWrongColors) {
      // FAST PATH: Direct draw (only when no color filtering needed)
      ctx.drawImage(
        templateBitmap,
        coords.pixelX * Template.SHREAD_SIZE,
        coords.pixelY * Template.SHREAD_SIZE
      );
      return;
    }

    // SLOW PATH: Enhanced rendering with crosshairs
    await renderTemplateWithEnhancement(
      ctx,
      canvasData,
      filterTemplate, // Pass the filter template (with settings) instead of actual template
      templateBitmap, // Use actual template's bitmap
      coords,
      tileCoords
    );
  }

  /**
   * Enhanced rendering: crosshairs + wrong color detection
   * Reference: old-src/templateManager.js:662-1006
   */
  async function renderTemplateWithEnhancement(
    ctx,
    canvasData,
    template,
    templateBitmap,
    coords,
    tileCoords
  ) {
    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────
    const SHREAD_SIZE = Template.SHREAD_SIZE;
    const SHREAD_CENTER = 1;                    // Center pixel offset within 3×3 block
    const ALPHA_THRESHOLD = 64;                 // Minimum alpha to consider pixel visible
    const BORDER_COLOR = [0, 100, 255, 255];    // Blue RGBA for corner borders

    // Canvas coordinate offset
    const offsetX = coords.pixelX * SHREAD_SIZE;
    const offsetY = coords.pixelY * SHREAD_SIZE;

    // ─────────────────────────────────────────────────────────────
    // Setup temporary canvas for template manipulation
    // ─────────────────────────────────────────────────────────────
    const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(templateBitmap, 0, 0);

    const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const templatePixels = templateData.data;
    const templateWidth = templateData.width;
    const templateHeight = templateData.height;

    // Keep original data copy for transparency checks (ensures dotted crosshair pattern)
    const originalPixels = new Uint8ClampedArray(templatePixels);

    // Track pixels needing crosshairs
    const enhancedPixels = new Set();
    const wrongColorPixels = new Set();

    // ─────────────────────────────────────────────────────────────
    // Phase 1: Identify enhanced pixels and apply color filtering
    // ─────────────────────────────────────────────────────────────
    for (let y = 0; y < templateHeight; y++) {
      for (let x = 0; x < templateWidth; x++) {
        // Only process center pixels of 3×3 shread blocks
        const isCenterPixel = (x % SHREAD_SIZE === SHREAD_CENTER) && (y % SHREAD_SIZE === SHREAD_CENTER);
        if (!isCenterPixel) continue;

        const idx = (y * templateWidth + x) * 4;
        const tR = templatePixels[idx];
        const tG = templatePixels[idx + 1];
        const tB = templatePixels[idx + 2];
        const tA = templatePixels[idx + 3];
        const templateRGB = [tR, tG, tB];

        // Skip transparent pixels
        if (tA < ALPHA_THRESHOLD) continue;

        // Handle disabled colors: make transparent and skip
        if (template.isColorDisabled(templateRGB)) {
          templatePixels[idx + 3] = 0;
          continue;
        }

        // Mark enhanced colors for crosshair drawing
        if (template.isColorEnhanced(templateRGB)) {
          enhancedPixels.add(`${x},${y}`);
        }

        // Detect wrong colors on canvas
        if (settingsStore.enhanceWrongColors) {
          const canvasX = x + offsetX;
          const canvasY = y + offsetY;
          const inBounds = canvasX >= 0 && canvasY >= 0 && canvasX < canvasData.width && canvasY < canvasData.height;

          if (inBounds) {
            const cIdx = (canvasY * canvasData.width + canvasX) * 4;
            const cR = canvasData.data[cIdx];
            const cG = canvasData.data[cIdx + 1];
            const cB = canvasData.data[cIdx + 2];
            const cA = canvasData.data[cIdx + 3];

            const isPainted = cA > 0;
            const colorMismatch = cR !== tR || cG !== tG || cB !== tB;

            if (isPainted && colorMismatch) {
              const pixelKey = `${x},${y}`;
              enhancedPixels.add(pixelKey);
              wrongColorPixels.add(pixelKey);
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Phase 2: Generate crosshairs for enhanced pixels
    // ─────────────────────────────────────────────────────────────
    if (enhancedPixels.size === 0) {
      tempCtx.putImageData(templateData, 0, 0);
      ctx.drawImage(tempCanvas, offsetX, offsetY);
      return;
    }

    // Crosshair settings
    const crosshairColor = settingsStore.crosshairColor || { rgb: [255, 0, 0], alpha: 255 };
    const showBorder = settingsStore.crosshairBorder || false;
    const enhancedSizeEnabled = settingsStore.crosshairEnhancedSize || false;
    const crosshairRadius = settingsStore.crosshairRadius || 256;

    // Base crosshair offsets (orthogonal: up, down, left, right)
    const BASE_OFFSETS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const CORNER_OFFSETS = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

    for (const pixelKey of enhancedPixels) {
      const [px, py] = pixelKey.split(',').map(Number);
      const isWrongColor = wrongColorPixels.has(pixelKey);

      // Build offset list (base + optional extended radius)
      let offsets = [...BASE_OFFSETS];

      if (enhancedSizeEnabled) {
        const shouldExtend = BASE_OFFSETS.some(([bdx, bdy]) => {
          const bx = px + bdx;
          const by = py + bdy;
          if (bx < 0 || bx >= templateWidth || by < 0 || by >= templateHeight) return false;

          const bi = (by * templateWidth + bx) * 4;
          const isTransparent = originalPixels[bi + 3] === 0;
          if (!isTransparent) return false;

          const cx = bx + offsetX;
          const cy = by + offsetY;
          const inBounds = cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height;
          const isPainted = inBounds && canvasData.data[(cy * canvasData.width + cx) * 4 + 3] > 0;

          return !isPainted || isWrongColor;
        });

        if (shouldExtend) {
          for (let d = 2; d <= crosshairRadius; d++) {
            offsets.push([0, -d], [0, d], [-d, 0], [d, 0]);
          }
        }
      }

      // Draw crosshair arms
      for (const [dx, dy] of offsets) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= templateWidth || ny >= templateHeight) continue;

        const nIdx = (ny * templateWidth + nx) * 4;
        const isTransparent = originalPixels[nIdx + 3] < ALPHA_THRESHOLD;
        if (!isTransparent) continue;

        // Check if canvas pixel is painted (smart border logic)
        const cx = nx + offsetX;
        const cy = ny + offsetY;
        const inBounds = cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height;
        const isPainted = inBounds && canvasData.data[(cy * canvasData.width + cx) * 4 + 3] > 0;

        // Draw crosshair if unpainted or wrong color (wrong colors always show)
        if (!isPainted || isWrongColor) {
          templatePixels[nIdx] = crosshairColor.rgb[0];
          templatePixels[nIdx + 1] = crosshairColor.rgb[1];
          templatePixels[nIdx + 2] = crosshairColor.rgb[2];
          templatePixels[nIdx + 3] = crosshairColor.alpha || 255;
        }
      }

      // Draw corner borders (diagonal pixels)
      if (showBorder) {
        for (const [dx, dy] of CORNER_OFFSETS) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= templateWidth || ny >= templateHeight) continue;

          const nIdx = (ny * templateWidth + nx) * 4;
          const isTransparent = originalPixels[nIdx + 3] < ALPHA_THRESHOLD;
          if (!isTransparent) continue;

          const cx = nx + offsetX;
          const cy = ny + offsetY;
          const inBounds = cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height;
          const isPainted = inBounds && canvasData.data[(cy * canvasData.width + cx) * 4 + 3] > 0;

          if (!isPainted) {
            templatePixels[nIdx] = BORDER_COLOR[0];
            templatePixels[nIdx + 1] = BORDER_COLOR[1];
            templatePixels[nIdx + 2] = BORDER_COLOR[2];
            templatePixels[nIdx + 3] = BORDER_COLOR[3];
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Finalize: write modified data and draw to main canvas
    // ─────────────────────────────────────────────────────────────
    tempCtx.putImageData(templateData, 0, 0);
    ctx.drawImage(tempCanvas, offsetX, offsetY);
  }

  /**
   * Count pixel progress for statistics
   * Reference: old-src/templateManager.js:1009-1150
   *
   * CRITICAL: Uses fresh tile blob data from server, NOT the already-overlayed canvas.
   * This ensures we compare against REAL server pixels, not our template overlay.
   */
  async function countPixelProgress(ctx, tileBlob, matchingTemplates, tileCoords) {
    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────
    const SHREAD_SIZE = Template.SHREAD_SIZE;
    const SHREAD_CENTER = 1;
    const CANVAS_SIZE = Template.TILE_SIZE * SHREAD_SIZE;  // 3000
    const ALPHA_THRESHOLD = 64;
    const DEFACE_COLOR = [222, 250, 206];  // Magic skip color

    // ─────────────────────────────────────────────────────────────
    // Initialize statistics
    // ─────────────────────────────────────────────────────────────
    const stats = {
      painted: 0,
      required: 0,
      wrong: 0,
      unpainted: 0,
      colorBreakdown: {}
    };

    // ─────────────────────────────────────────────────────────────
    // Extract fresh server tile data (not template-overlayed)
    // ─────────────────────────────────────────────────────────────
    let serverPixels;
    try {
      const serverBitmap = await createImageBitmap(tileBlob);
      const serverCanvas = document.createElement('canvas');
      serverCanvas.width = CANVAS_SIZE;
      serverCanvas.height = CANVAS_SIZE;

      const serverCtx = serverCanvas.getContext('2d', { willReadFrequently: true });
      serverCtx.imageSmoothingEnabled = false;
      serverCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      serverCtx.drawImage(serverBitmap, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      serverPixels = serverCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    } catch {
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // Process each matching template
    // ─────────────────────────────────────────────────────────────
    for (const { template, tileKey, coords } of matchingTemplates) {
      const templateTileBlob = await db.loadTile(template.id, tileKey);
      if (!templateTileBlob) continue;

      // Load template tile pixels
      const templateBitmap = await createImageBitmap(templateTileBlob);
      const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(templateBitmap, 0, 0);

      const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const templatePixels = templateData.data;
      const templateWidth = templateData.width;
      const templateHeight = templateData.height;

      // Canvas offset for this template tile
      const offsetX = coords.pixelX * SHREAD_SIZE;
      const offsetY = coords.pixelY * SHREAD_SIZE;

      // ─────────────────────────────────────────────────────────────
      // Iterate template pixels (center of each 3×3 block only)
      // ─────────────────────────────────────────────────────────────
      for (let y = 0; y < templateHeight; y++) {
        for (let x = 0; x < templateWidth; x++) {
          // Only process center pixels of shread blocks
          const isCenterPixel = (x % SHREAD_SIZE === SHREAD_CENTER) && (y % SHREAD_SIZE === SHREAD_CENTER);
          if (!isCenterPixel) continue;

          // Calculate global canvas position
          const gx = x + offsetX;
          const gy = y + offsetY;
          const inBounds = gx >= 0 && gy >= 0 && gx < CANVAS_SIZE && gy < CANVAS_SIZE;
          if (!inBounds) continue;

          // Read template pixel
          const tIdx = (y * templateWidth + x) * 4;
          const tR = templatePixels[tIdx];
          const tG = templatePixels[tIdx + 1];
          const tB = templatePixels[tIdx + 2];
          const tA = templatePixels[tIdx + 3];

          // Skip transparent pixels
          if (tA < ALPHA_THRESHOLD) continue;

          // Skip magic "deface" color
          const isDefaceColor = tR === DEFACE_COLOR[0] && tG === DEFACE_COLOR[1] && tB === DEFACE_COLOR[2];
          if (isDefaceColor) continue;

          // ─────────────────────────────────────────────────────────
          // Count this pixel and track per-color breakdown
          // ─────────────────────────────────────────────────────────
          stats.required++;

          const colorKey = `${tR},${tG},${tB}`;
          if (!stats.colorBreakdown[colorKey]) {
            stats.colorBreakdown[colorKey] = { painted: 0, required: 0, wrong: 0 };
          }
          stats.colorBreakdown[colorKey].required++;

          // Read server pixel at same position
          const sIdx = (gy * CANVAS_SIZE + gx) * 4;
          const sR = serverPixels[sIdx];
          const sG = serverPixels[sIdx + 1];
          const sB = serverPixels[sIdx + 2];
          const sA = serverPixels[sIdx + 3];

          // ─────────────────────────────────────────────────────────
          // Compare: unpainted / correct / wrong
          // ─────────────────────────────────────────────────────────
          const isServerUnpainted = sA < ALPHA_THRESHOLD;
          const colorsMatch = sR === tR && sG === tG && sB === tB;

          if (isServerUnpainted) {
            stats.unpainted++;
          } else if (colorsMatch) {
            stats.painted++;
            stats.colorBreakdown[colorKey].painted++;
          } else {
            stats.wrong++;
            stats.colorBreakdown[colorKey].wrong++;

            // Capture first wrong pixel coordinates for "Fly to" feature
            if (!stats.colorBreakdown[colorKey].firstWrongPixel) {
              const tilePixelX = Math.floor(gx / SHREAD_SIZE);
              const tilePixelY = Math.floor(gy / SHREAD_SIZE);
              stats.colorBreakdown[colorKey].firstWrongPixel = [tilePixelX, tilePixelY];
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Store aggregated progress
    // ─────────────────────────────────────────────────────────────
    const tileCoordsKey = `${tileCoords[0]},${tileCoords[1]}`;
    templateStore.setTileProgress(tileCoordsKey, stats);
  }

  // Register the core renderer for force refresh capability
  // Reference: old-src/tileManager.js:258 (originalDrawTemplateOnTile)
  tileCache.setOriginalRenderer(renderTileCore);

  return {
    // Main entry point (with caching)
    drawTemplateOnTile,

    // Core renderer (without caching) - for force refresh
    renderTileCore,

    // Tile cache instance for external control
    tileCache
  };
}
