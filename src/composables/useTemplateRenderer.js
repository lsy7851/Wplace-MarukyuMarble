import { Template } from '@/models/Template';
import { useTemplateStore } from '@/stores/templateStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIndexedDB } from './useIndexedDB';

/**
 * Template rendering composable
 *
 * Handles real-time rendering of templates on canvas tiles
 * Reference: old-src/templateManager.js:487-1310
 */
export function useTemplateRenderer() {
  const templateStore = useTemplateStore();
  const settingsStore = useSettingsStore();
  const db = useIndexedDB();

  /**
   * Main rendering function called for each tile update
   * @param {Blob} tileBlob - Canvas tile from Wplace API
   * @param {[number, number]} tileCoords - [tileX, tileY]
   * @returns {Promise<Blob>} Modified tile with templates overlaid
   */
  async function drawTemplateOnTile(tileBlob, tileCoords) {
    const [tileX, tileY] = tileCoords;
    const tileSize = Template.TILE_SIZE;
    const drawMult = Template.SHREAD_SIZE;

    // STEP 1: Find matching templates
    const matchingTemplates = await findMatchingTemplates(tileX, tileY);

    if (matchingTemplates.length === 0) {
      // No templates for this tile, return original
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

    // STEP 3: Render templates (sorted by priority)
    for (const { template, tileKey, coords } of matchingTemplates) {
      await renderTemplate(ctx, canvasData, template, tileKey, coords, tileCoords);
    }

    // STEP 4: Count pixels for progress tracking
    await countPixelProgress(ctx, canvasData, matchingTemplates, tileCoords);

    // TODO: STEP 5: Apply error map if enabled (Phase 6)
    // if (settingsStore.settings.errorMapEnabled) {
    //   await applyErrorMap(ctx, matchingTemplates, tileCoords);
    // }

    // Convert to blob
    return await canvas.convertToBlob({ type: 'image/png' });
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
   */
  async function renderTemplate(ctx, canvasData, template, tileKey, coords, tileCoords) {
    // Load template tile from IndexedDB
    const tileBlob = await db.loadTile(template.id, tileKey);
    if (!tileBlob) return;

    const templateBitmap = await createImageBitmap(tileBlob);

    // Check if we need enhanced rendering (crosshairs)
    const hasEnhancedColors = template.enhancedColors.size > 0;
    const enhanceWrongColors = settingsStore.settings?.enhanceWrongColors || false;

    if (!hasEnhancedColors && !enhanceWrongColors) {
      // FAST PATH: Direct draw
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
      template,
      templateBitmap,
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
    // Create temp canvas
    const tempCanvas = new OffscreenCanvas(
      templateBitmap.width,
      templateBitmap.height
    );
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;  // Pixel-perfect rendering
    tempCtx.drawImage(templateBitmap, 0, 0);

    // Get pixel data
    const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const enhancedPixels = new Set();  // Store "x,y" of enhanced pixels

    const SHREAD_SIZE = Template.SHREAD_SIZE;

    // Phase 1: Identify enhanced pixels + apply color filtering
    for (let y = 0; y < templateData.height; y++) {
      for (let x = 0; x < templateData.width; x++) {
        // Only check center pixels of 3×3 blocks
        if (x % SHREAD_SIZE !== 1 || y % SHREAD_SIZE !== 1) {
          continue;
        }

        const idx = (y * templateData.width + x) * 4;
        const tR = templateData.data[idx];
        const tG = templateData.data[idx + 1];
        const tB = templateData.data[idx + 2];
        const tA = templateData.data[idx + 3];

        if (tA < 64) continue;  // Skip transparent

        // Check if color is disabled
        if (template.isColorDisabled([tR, tG, tB])) {
          templateData.data[idx + 3] = 0;  // Make transparent
          continue;
        }

        // Check if color is enhanced
        if (template.isColorEnhanced([tR, tG, tB])) {
          enhancedPixels.add(`${x},${y}`);
        }

        // Check if wrong color (if setting enabled)
        if (settingsStore.settings?.enhanceWrongColors) {
          const cIdx = idx;  // Same position in canvas
          const cR = canvasData.data[cIdx];
          const cG = canvasData.data[cIdx + 1];
          const cB = canvasData.data[cIdx + 2];

          if (cR !== tR || cG !== tG || cB !== tB) {
            enhancedPixels.add(`${x},${y}`);  // Wrong color
          }
        }
      }
    }

    // Phase 2: Generate crosshairs
    if (enhancedPixels.size > 0) {
      const crosshairColor = settingsStore.settings?.crosshairColor || { r: 255, g: 0, b: 0 };
      const showBorder = settingsStore.settings?.crosshairBorder || false;

      for (const pixelKey of enhancedPixels) {
        const [px, py] = pixelKey.split(',').map(Number);

        // Orthogonal neighbors (up, down, left, right)
        const offsets = [
          [0, -1], [0, 1], [-1, 0], [1, 0]
        ];

        for (const [dx, dy] of offsets) {
          const nx = px + dx;
          const ny = py + dy;

          if (nx < 0 || ny < 0 || nx >= templateData.width || ny >= templateData.height) {
            continue;
          }

          const nIdx = (ny * templateData.width + nx) * 4;

          // Check if neighbor is transparent in template
          if (templateData.data[nIdx + 3] < 64) {
            let skipPainted = false;

            // Check if unpainted on canvas (Legacy behavior: Smart borders)
            // MUST apply offset to map template coords (nx, ny) to canvas coords
            const offsetX = coords.pixelX * Template.SHREAD_SIZE;
            const offsetY = coords.pixelY * Template.SHREAD_SIZE;

            const cx = nx + offsetX;
            const cy = ny + offsetY;

            // Bounds check for canvas
            if (cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height) {
              const cIdx = (cy * canvasData.width + cx) * 4;
              // Check if underlying pixel is painted (>0 alpha)
              if (canvasData.data[cIdx + 3] > 0) {
                skipPainted = true;
              }
            }

            // If painted, we only skip if it's NOT a wrong color
            // (If it is a wrong color, we want the crosshair to highlight it despite being painted)
            // Note: Currently we don't have isWrongColor per pixel here (optimization), 
            // so we follow basic legacy logic: skip if painted.
            if (!skipPainted) {
              // Apply crosshair color
              templateData.data[nIdx] = crosshairColor.r;
              templateData.data[nIdx + 1] = crosshairColor.g;
              templateData.data[nIdx + 2] = crosshairColor.b;
              templateData.data[nIdx + 3] = 255;
            }
          }
        }

        // Diagonal corners (if border enabled)
        if (showBorder) {
          const cornerOffsets = [
            [1, 1], [-1, 1], [1, -1], [-1, -1]
          ];

          const offsetX = coords.pixelX * Template.SHREAD_SIZE;
          const offsetY = coords.pixelY * Template.SHREAD_SIZE;

          for (const [dx, dy] of cornerOffsets) {
            const nx = px + dx;
            const ny = py + dy;

            if (nx < 0 || ny < 0 || nx >= templateData.width || ny >= templateData.height) {
              continue;
            }

            const nIdx = (ny * templateData.width + nx) * 4;

            if (templateData.data[nIdx + 3] < 64) {
              // Check canvas painting for borders too
              const cx = nx + offsetX;
              const cy = ny + offsetY;
              let skipPainted = false;

              if (cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height) {
                const cIdx = (cy * canvasData.width + cx) * 4;
                if (canvasData.data[cIdx + 3] > 0) skipPainted = true;
              }

              if (!skipPainted) {
                // Apply blue border
                templateData.data[nIdx] = 0;
                templateData.data[nIdx + 1] = 100;
                templateData.data[nIdx + 2] = 255;
                templateData.data[nIdx + 3] = 255;
              }
            }
          }
        }
      }
    }

    // Put processed data back
    tempCtx.putImageData(templateData, 0, 0);

    // Draw to main canvas
    ctx.drawImage(
      tempCanvas,
      coords.pixelX * Template.SHREAD_SIZE,
      coords.pixelY * Template.SHREAD_SIZE
    );
  }

  /**
   * Count pixel progress for statistics
   * Reference: old-src/templateManager.js:1009-1150
   */
  async function countPixelProgress(ctx, canvasData, matchingTemplates, tileCoords) {
    const stats = {
      painted: 0,
      required: 0,
      wrong: 0,
      colorBreakdown: {}
    };

    const SHREAD_SIZE = Template.SHREAD_SIZE;

    for (const { template, tileKey } of matchingTemplates) {
      const tileBlob = await db.loadTile(template.id, tileKey);
      if (!tileBlob) continue;

      const templateBitmap = await createImageBitmap(tileBlob);
      const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;  // Pixel-perfect rendering
      tempCtx.drawImage(templateBitmap, 0, 0);
      const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // Count pixels (only center of 3×3 blocks)
      for (let y = 1; y < templateData.height; y += SHREAD_SIZE) {
        for (let x = 1; x < templateData.width; x += SHREAD_SIZE) {
          const idx = (y * templateData.width + x) * 4;
          const tR = templateData.data[idx];
          const tG = templateData.data[idx + 1];
          const tB = templateData.data[idx + 2];
          const tA = templateData.data[idx + 3];

          if (tA < 64) continue;  // Skip transparent

          stats.required++;

          const colorKey = `${tR},${tG},${tB}`;
          if (!stats.colorBreakdown[colorKey]) {
            stats.colorBreakdown[colorKey] = {
              painted: 0,
              required: 0,
              wrong: 0
            };
          }

          stats.colorBreakdown[colorKey].required++;

          // Compare with canvas
          const cIdx = idx;
          const cR = canvasData.data[cIdx];
          const cG = canvasData.data[cIdx + 1];
          const cB = canvasData.data[cIdx + 2];
          const cA = canvasData.data[cIdx + 3];

          if (cA >= 64) {
            if (cR === tR && cG === tG && cB === tB) {
              stats.painted++;
              stats.colorBreakdown[colorKey].painted++;
            } else {
              stats.wrong++;
              stats.colorBreakdown[colorKey].wrong++;
            }
          }
        }
      }
    }

    // Store tile progress
    const tileKey = `${tileCoords[0]},${tileCoords[1]}`;
    templateStore.setTileProgress(tileKey, stats);
  }

  return {
    drawTemplateOnTile
  };
}
