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
    // Returns early if no templates should be drawn (legacy: templateManager.js:490)
    if (!templateStore.templatesShouldBeDrawn) {
      return tileBlob;
    }

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

    console.log(`🔍 [Render] hasEnhancedColors=${hasEnhancedColors}, hasDisabledColors=${hasDisabledColors}, enhanceWrongColors=${enhanceWrongColors}`);

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
    // CRITICAL: Keep a copy of original data for transparency checks (legacy: line 683)
    // This ensures crosshairs are drawn based on ORIGINAL template transparency,
    // not the modified data (which would cause solid lines instead of dotted)
    const originalData = new Uint8ClampedArray(templateData.data);
    const enhancedPixels = new Set();  // Store "x,y" of enhanced pixels
    const wrongColorPixels = new Set();  // Store wrong color pixels separately
    let wrongColorCount = 0;  // Debug counter

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
        if (settingsStore.enhanceWrongColors) {
          // Convert template coords to canvas coords
          const offsetX = coords.pixelX * SHREAD_SIZE;
          const offsetY = coords.pixelY * SHREAD_SIZE;
          const canvasX = x + offsetX;
          const canvasY = y + offsetY;

          // Bounds check for canvas
          if (canvasX >= 0 && canvasY >= 0 && canvasX < canvasData.width && canvasY < canvasData.height) {
            const cIdx = (canvasY * canvasData.width + canvasX) * 4;
            const cR = canvasData.data[cIdx];
            const cG = canvasData.data[cIdx + 1];
            const cB = canvasData.data[cIdx + 2];
            const cA = canvasData.data[cIdx + 3];

            // Only check if pixel is painted (legacy: canvasA > 0)
            if (cA > 0 && (cR !== tR || cG !== tG || cB !== tB)) {
              const pixelKey = `${x},${y}`;
              enhancedPixels.add(pixelKey);  // Wrong color
              wrongColorPixels.add(pixelKey);  // Track separately for skipPainted bypass
              wrongColorCount++;
            }
          }
        }
      }
    }

    console.log(`🎯 [Enhancement] enhanceWrongColors=${settingsStore.enhanceWrongColors}, enhancedPixels.size=${enhancedPixels.size}, wrongColorCount=${wrongColorCount}`);
    console.log(`📐 [Coords] pixelX=${coords.pixelX}, pixelY=${coords.pixelY}, templateSize=${templateData.width}x${templateData.height}, canvasSize=${canvasData.width}x${canvasData.height}`);

    // Phase 2: Generate crosshairs
    if (enhancedPixels.size > 0) {
      const crosshairColor = settingsStore.crosshairColor || { rgb: [255, 0, 0], alpha: 255 };
      const showBorder = settingsStore.crosshairBorder || false;
      const enhancedSizeEnabled = settingsStore.crosshairEnhancedSize || false;
      const crosshairRadius = settingsStore.crosshairRadius || 256;

      let crosshairDrawnCount = 0;
      let skippedNotTransparent = 0;
      let skippedPainted = 0;

      for (const pixelKey of enhancedPixels) {
        const [px, py] = pixelKey.split(',').map(Number);
        const isWrongColor = wrongColorPixels.has(pixelKey);

        // Build base offsets (orthogonal neighbors: up, down, left, right)
        const baseOffsets = [
          [0, -1], [0, 1], [-1, 0], [1, 0]
        ];

        let offsets = [...baseOffsets];

        // If enhanced size is enabled, expand crosshair radius
        // Legacy logic: templateManager.js:900-907
        if (enhancedSizeEnabled) {
          // Check if any base offset would be eligible (transparent in template and not painted on canvas)
          // If so, add expanded offsets
          let baseEligible = false;

          for (const [bdx, bdy] of baseOffsets) {
            const bx = px + bdx;
            const by = py + bdy;

            if (bx < 0 || bx >= templateData.width || by < 0 || by >= templateData.height) continue;

            const bi = (by * templateData.width + bx) * 4;

            // Must be transparent in ORIGINAL template
            if (originalData[bi + 3] !== 0) continue;

            // Check if unpainted on canvas
            const offsetX = coords.pixelX * Template.SHREAD_SIZE;
            const offsetY = coords.pixelY * Template.SHREAD_SIZE;
            const cx = bx + offsetX;
            const cy = by + offsetY;

            let painted = false;
            if (cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height) {
              const cIdx = (cy * canvasData.width + cx) * 4;
              painted = canvasData.data[cIdx + 3] > 0;
            }

            if (!painted || isWrongColor) {
              baseEligible = true;
              break;
            }
          }

          // If base offsets are eligible, add expanded offsets up to radius
          if (baseEligible) {
            for (let d = 2; d <= crosshairRadius; d++) {
              offsets.push([0, -d]);  // Up
              offsets.push([0, d]);   // Down
              offsets.push([-d, 0]);  // Left
              offsets.push([d, 0]);   // Right
            }
          }
        }

        for (const [dx, dy] of offsets) {
          const nx = px + dx;
          const ny = py + dy;

          if (nx < 0 || ny < 0 || nx >= templateData.width || ny >= templateData.height) {
            continue;
          }

          const nIdx = (ny * templateData.width + nx) * 4;

          // Check if neighbor is transparent in ORIGINAL template (not modified data)
          // Using originalData ensures dotted pattern is preserved (legacy: line 920)
          if (originalData[nIdx + 3] < 64) {
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

            // For wrong colors, we want to show crosshair even if pixel is painted
            // (to highlight the wrong color) - Legacy: templateManager.js:937
            if (!skipPainted || isWrongColor) {
              // Apply crosshair color
              // Dotted effect comes naturally from templates covering each other's crosshairs
              templateData.data[nIdx] = crosshairColor.rgb[0];
              templateData.data[nIdx + 1] = crosshairColor.rgb[1];
              templateData.data[nIdx + 2] = crosshairColor.rgb[2];
              templateData.data[nIdx + 3] = crosshairColor.alpha || 255;
              crosshairDrawnCount++;
            } else {
              skippedPainted++;
            }
          } else {
            skippedNotTransparent++;
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

            // Check transparency using ORIGINAL data (same as crosshair logic)
            if (originalData[nIdx + 3] < 64) {
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

      console.log(`✏️ [Crosshair] drawn=${crosshairDrawnCount}, skippedNotTransparent=${skippedNotTransparent}, skippedPainted=${skippedPainted}`);
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
    const canvasWidth = Template.TILE_SIZE * SHREAD_SIZE;  // 1000 * 3 = 3000

    for (const { template, tileKey, coords } of matchingTemplates) {
      const tileBlob = await db.loadTile(template.id, tileKey);
      if (!tileBlob) continue;

      const templateBitmap = await createImageBitmap(tileBlob);
      const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;  // Pixel-perfect rendering
      tempCtx.drawImage(templateBitmap, 0, 0);
      const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // Calculate offset from coords (legacy: offsetX/offsetY = pixelCoords * drawMult)
      const offsetX = coords.pixelX * SHREAD_SIZE;
      const offsetY = coords.pixelY * SHREAD_SIZE;

      let templatePixelCount = 0;
      let templatePaintedCount = 0;
      let templateWrongCount = 0;

      // Count pixels (only center of 3×3 blocks)
      // Legacy: Iterate ALL pixels and filter by modulo (matches legacy exactly)
      for (let y = 0; y < templateData.height; y++) {
        for (let x = 0; x < templateData.width; x++) {
          // Only evaluate the center pixel of each 3×3 block (legacy condition)
          if ((x % SHREAD_SIZE) !== 1 || (y % SHREAD_SIZE) !== 1) {
            continue;
          }

          const idx = (y * templateData.width + x) * 4;
          const tR = templateData.data[idx];
          const tG = templateData.data[idx + 1];
          const tB = templateData.data[idx + 2];
          const tA = templateData.data[idx + 3];

          if (tA < 64) continue;  // Skip transparent

          // Skip #deface magic color (222, 250, 206) - legacy compatibility
          if (tR === 222 && tG === 250 && tB === 206) continue;

          stats.required++;
          templatePixelCount++;

          const colorKey = `${tR},${tG},${tB}`;
          if (!stats.colorBreakdown[colorKey]) {
            stats.colorBreakdown[colorKey] = {
              painted: 0,
              required: 0,
              wrong: 0
            };
          }

          stats.colorBreakdown[colorKey].required++;

          // Calculate canvas position (legacy: gx = x + offsetX, gy = y + offsetY)
          const gx = x + offsetX;
          const gy = y + offsetY;

          // Bounds check
          if (gx < 0 || gy < 0 || gx >= canvasWidth || gy >= canvasWidth) {
            continue;
          }

          // Calculate canvas pixel index (legacy: tileIdx = (gy * drawSize + gx) * 4)
          const cIdx = (gy * canvasWidth + gx) * 4;
          const cR = canvasData.data[cIdx];
          const cG = canvasData.data[cIdx + 1];
          const cB = canvasData.data[cIdx + 2];
          const cA = canvasData.data[cIdx + 3];

          if (cA >= 64) {
            if (cR === tR && cG === tG && cB === tB) {
              stats.painted++;
              stats.colorBreakdown[colorKey].painted++;
              templatePaintedCount++;
            } else {
              stats.wrong++;
              stats.colorBreakdown[colorKey].wrong++;
              templateWrongCount++;
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
