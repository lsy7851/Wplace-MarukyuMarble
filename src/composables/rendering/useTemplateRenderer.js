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
import { useIndexedDB } from '@/composables/storage/useIndexedDB';
import { useTileCache } from '@/composables/storage/useTileCache';
import { useErrorMap } from '@/composables/rendering/useErrorMap';
import { useEnhancedRendering } from '@/composables/rendering/useEnhancedRendering';
import { usePixelProgress } from '@/composables/rendering/usePixelProgress';

/**
 * Template rendering composable (Orchestrator)
 *
 * Coordinates tile rendering pipeline:
 * 1. Cache lookup
 * 2. Template matching
 * 3. Canvas rendering (delegates to useEnhancedRendering for crosshairs)
 * 4. Pixel progress counting (delegates to usePixelProgress)
 * 5. Error map overlay
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
  const { renderTemplateWithEnhancement } = useEnhancedRendering();
  const { countPixelProgress } = usePixelProgress();

  /**
   * Core rendering function (without cache)
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
    const canvas = new OffscreenCanvas(tileSize * drawMult, tileSize * drawMult);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Draw base tile from server
    const baseBitmap = await createImageBitmap(tileBlob);
    ctx.drawImage(baseBitmap, 0, 0, canvas.width, canvas.height);

    // Get canvas pixel data for comparison
    const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // STEP 3: Draw templates
    for (let i = 0; i < matchingTemplates.length; i++) {
      const {
        template: matchedTemplate,
        tileKey: matchedTileKey,
        coords: matchedCoords,
      } = matchingTemplates[i];
      await renderTemplate(
        ctx,
        canvasData,
        matchedTemplate,
        matchedTileKey,
        matchedCoords,
        tileCoords,
        i
      );
    }

    // STEP 4: Count pixels for progress tracking
    await countPixelProgress(ctx, tileBlob, matchingTemplates, tileCoords);

    // STEP 5: Apply error map if enabled
    if (settingsStore.errorMapEnabled) {
      const originalCanvas = new OffscreenCanvas(tileSize * drawMult, tileSize * drawMult);
      const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
      originalCtx.imageSmoothingEnabled = false;
      originalCtx.drawImage(baseBitmap, 0, 0, originalCanvas.width, originalCanvas.height);

      for (const { template, tileKey, coords } of matchingTemplates) {
        const templateTileBlob = await db.loadTile(template.id, tileKey);
        if (!templateTileBlob) continue;

        const templateBitmap = await createImageBitmap(templateTileBlob);

        await errorMap.applyErrorMap(
          originalCtx,
          ctx,
          template,
          templateBitmap,
          coords,
          tileSize * drawMult
        );
      }
    }

    return await canvas.convertToBlob({ type: 'image/png' });
  }

  /**
   * Main rendering function called for each tile update
   * Integrates with useTileCache for caching and pause functionality
   *
   * @param {Blob} tileBlob - Canvas tile from Wplace API
   * @param {[number, number]} tileCoords - [tileX, tileY]
   * @returns {Promise<Blob>} Modified tile with templates overlaid
   */
  async function drawTemplateOnTile(tileBlob, tileCoords) {
    if (!templateStore.templatesShouldBeDrawn) {
      return tileBlob;
    }

    const cachedResult = tileCache.get(tileCoords, tileBlob);
    if (cachedResult) {
      return cachedResult;
    }

    if (tileCache.paused.value) {
      return tileBlob;
    }

    const result = await renderTileCore(tileBlob, tileCoords);
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
    const tileBlob = await db.loadTile(template.id, tileKey);
    if (!tileBlob) return;

    const templateBitmap = await createImageBitmap(tileBlob);

    // LEGACY BEHAVIOR: Force checking index 0 for filter settings
    const filterTemplate = templateStore.templates[0] || template;

    const hasEnhancedColors = filterTemplate.enhancedColors.size > 0;
    const hasDisabledColors = filterTemplate.disabledColors.size > 0;
    const enhanceWrongColors = settingsStore.enhanceWrongColors || false;

    if (!hasEnhancedColors && !hasDisabledColors && !enhanceWrongColors) {
      // FAST PATH: Direct draw
      ctx.drawImage(
        templateBitmap,
        coords.pixelX * Template.SHREAD_SIZE,
        coords.pixelY * Template.SHREAD_SIZE
      );
      return;
    }

    // SLOW PATH: Enhanced rendering with crosshairs
    await renderTemplateWithEnhancement(ctx, canvasData, filterTemplate, templateBitmap, coords, tileCoords);
  }

  // Register the core renderer for force refresh capability
  tileCache.setOriginalRenderer(renderTileCore);

  return {
    drawTemplateOnTile,
    renderTileCore,
    tileCache,
  };
}
