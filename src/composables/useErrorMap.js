import { Template } from '@/models/Template';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Error Map Composable
 *
 * Provides pixel comparison and color-coded overlay for templates
 * - GREEN: Correct pixel (template matches canvas)
 * - RED: Wrong pixel (template doesn't match canvas)
 * - YELLOW (optional): Unpainted pixel
 *
 * Reference: old-src/templateManager.js:1152-1299
 */
export function useErrorMap() {
  const settingsStore = useSettingsStore();

  /**
   * Analyze template vs canvas pixels and generate error map data
   * @param {CanvasRenderingContext2D} canvasCtx - Canvas context (original tile)
   * @param {Object} template - Template instance
   * @param {ImageBitmap} templateBitmap - Template tile bitmap
   * @param {Object} coords - Tile coordinates {tileX, tileY, pixelX, pixelY}
   * @param {number} drawSize - Canvas size (usually TILE_SIZE * SHREAD_SIZE = 3000)
   * @returns {Promise<{correctMap: Array, wrongMap: Array}>}
   */
  async function analyzePixels(canvasCtx, template, templateBitmap, coords, drawSize) {
    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────
    const SHREAD_SIZE = Template.SHREAD_SIZE;
    const SHREAD_CENTER = 1;
    const ALPHA_THRESHOLD = 64;

    const correctMap = [];
    const wrongMap = [];

    try {
      // ─────────────────────────────────────────────────────────────
      // Load pixel data from canvas and template
      // ─────────────────────────────────────────────────────────────
      const canvasPixels = canvasCtx.getImageData(0, 0, drawSize, drawSize).data;

      const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(templateBitmap, 0, 0);

      const templateData = tempCtx.getImageData(0, 0, templateBitmap.width, templateBitmap.height);
      const templatePixels = templateData.data;
      const templateWidth = templateBitmap.width;
      const templateHeight = templateBitmap.height;

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
          const inBounds = gx >= 0 && gy >= 0 && gx < drawSize && gy < drawSize;
          if (!inBounds) continue;

          // Read template pixel
          const tIdx = (y * templateWidth + x) * 4;
          const tr = templatePixels[tIdx];
          const tg = templatePixels[tIdx + 1];
          const tb = templatePixels[tIdx + 2];
          const ta = templatePixels[tIdx + 3];
          const templateColorKey = `${tr},${tg},${tb}`;

          // Read canvas pixel at same position
          const cIdx = (gy * drawSize + gx) * 4;
          const pr = canvasPixels[cIdx];
          const pg = canvasPixels[cIdx + 1];
          const pb = canvasPixels[cIdx + 2];
          const pa = canvasPixels[cIdx + 3];

          // ─────────────────────────────────────────────────────────
          // Handle transparent template pixels
          // ─────────────────────────────────────────────────────────
          if (ta < ALPHA_THRESHOLD) {
            // Check for wrong pixel in transparent area (canvas painted where shouldn't be)
            const canvasIsPainted = pa >= ALPHA_THRESHOLD;
            if (canvasIsPainted) {
              const canvasColorKey = `${pr},${pg},${pb}`;
              const isValidPaletteColor = template.colorPalette && template.colorPalette[canvasColorKey];
              if (isValidPaletteColor) {
                wrongMap.push({ x: gx, y: gy, color: templateColorKey, inTransparent: true });
              }
            }
            continue;
          }

          // Skip disabled colors
          if (template.isColorDisabled([tr, tg, tb])) continue;

          // ─────────────────────────────────────────────────────────
          // Compare: unpainted / correct / wrong
          // ─────────────────────────────────────────────────────────
          const canvasIsUnpainted = pa < ALPHA_THRESHOLD;
          const colorsMatch = pr === tr && pg === tg && pb === tb;

          if (canvasIsUnpainted) {
            if (settingsStore.showUnpaintedAsWrong) {
              wrongMap.push({ x: gx, y: gy, color: templateColorKey, unpainted: true });
            }
          } else if (colorsMatch) {
            correctMap.push({ x: gx, y: gy, color: templateColorKey });
          } else {
            wrongMap.push({ x: gx, y: gy, color: templateColorKey, unpainted: false });
          }
        }
      }
    } catch {
      // Ignore analysis errors
    }

    return { correctMap, wrongMap };
  }

  /**
   * Draw error map overlay on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
   * @param {Array} correctMap - Array of correct pixels {x, y, color}
   * @param {Array} wrongMap - Array of wrong pixels {x, y, color, unpainted}
   * @param {Object} template - Template instance (for color filtering)
   */
  function drawErrorMap(ctx, correctMap, wrongMap, template) {
    const SHREAD_SIZE = Template.SHREAD_SIZE;

    // Helper: Check if color is disabled
    const isColorDisabled = (colorKey) => {
      if (!template) return false;
      const rgb = colorKey.split(',').map(Number);
      return template.isColorDisabled(rgb);
    };

    ctx.globalCompositeOperation = 'source-over';

    // Draw wrong pixels (red overlay)
    if (settingsStore.showWrongPixels && wrongMap.length > 0) {
      for (const { x, y, color, unpainted } of wrongMap) {
        // Skip disabled colors
        if (isColorDisabled(color)) continue;

        if (unpainted) {
          // Unpainted pixels: yellow, single pixel
          ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
          ctx.fillRect(x, y, 1, 1);
        } else {
          // Wrong pixels: red, 3×3 block
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          const offset = Math.floor(SHREAD_SIZE / 2);
          ctx.fillRect(x - offset, y - offset, SHREAD_SIZE, SHREAD_SIZE);
        }
      }
    }

    // Draw correct pixels (green overlay)
    if (settingsStore.showCorrectPixels && correctMap.length > 0) {
      ctx.fillStyle = 'rgba(0, 128, 0, 0.6)';
      const offset = Math.floor(SHREAD_SIZE / 2);

      for (const { x, y, color } of correctMap) {
        // Skip disabled colors
        if (isColorDisabled(color)) continue;

        // Correct pixels: green, 3×3 block
        ctx.fillRect(x - offset, y - offset, SHREAD_SIZE, SHREAD_SIZE);
      }
    }
  }

  /**
   * Generate and draw error map for a template tile
   * @param {CanvasRenderingContext2D} canvasCtx - Original canvas context (for pixel comparison)
   * @param {CanvasRenderingContext2D} overlayCtx - Overlay canvas context (to draw error map on)
   * @param {Object} template - Template instance
   * @param {ImageBitmap} templateBitmap - Template tile bitmap
   * @param {Object} coords - Tile coordinates {tileX, tileY, pixelX, pixelY}
   * @param {number} drawSize - Canvas size
   */
  async function applyErrorMap(canvasCtx, overlayCtx, template, templateBitmap, coords, drawSize) {
    // Skip if error map disabled
    if (!settingsStore.errorMapEnabled) {
      return;
    }

    // Skip if both overlays are disabled
    if (!settingsStore.showWrongPixels && !settingsStore.showCorrectPixels) {
      return;
    }

    // Analyze pixels
    const { correctMap, wrongMap } = await analyzePixels(
      canvasCtx,
      template,
      templateBitmap,
      coords,
      drawSize
    );

    // Draw error map
    drawErrorMap(overlayCtx, correctMap, wrongMap, template);

    return { correctMap, wrongMap };
  }

  /**
   * Get error map statistics
   * @param {Array} correctMap - Correct pixels
   * @param {Array} wrongMap - Wrong pixels
   * @returns {Object} Statistics
   */
  function getErrorMapStats(correctMap, wrongMap) {
    const totalPixels = correctMap.length + wrongMap.length;
    const correctCount = correctMap.length;
    const wrongCount = wrongMap.filter(p => !p.unpainted).length;
    const unpaintedCount = wrongMap.filter(p => p.unpainted).length;

    return {
      total: totalPixels,
      correct: correctCount,
      wrong: wrongCount,
      unpainted: unpaintedCount,
      accuracy: totalPixels > 0 ? (correctCount / totalPixels) * 100 : 0
    };
  }

  /**
   * Aggregate error map stats by color
   * @param {Array} correctMap - Correct pixels
   * @param {Array} wrongMap - Wrong pixels
   * @returns {Object} Per-color statistics {colorKey: {correct, wrong, unpainted}}
   */
  function getColorStats(correctMap, wrongMap) {
    const stats = {};

    for (const { color } of correctMap) {
      if (!stats[color]) {
        stats[color] = { correct: 0, wrong: 0, unpainted: 0 };
      }
      stats[color].correct++;
    }

    for (const { color, unpainted } of wrongMap) {
      if (!stats[color]) {
        stats[color] = { correct: 0, wrong: 0, unpainted: 0 };
      }
      if (unpainted) {
        stats[color].unpainted++;
      } else {
        stats[color].wrong++;
      }
    }

    return stats;
  }

  return {
    analyzePixels,
    drawErrorMap,
    applyErrorMap,
    getErrorMapStats,
    getColorStats
  };
}
