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
import { useIndexedDB } from '@/composables/storage/useIndexedDB';

/**
 * Pixel progress counting composable
 *
 * Counts painted/wrong/unpainted pixels for progress tracking.
 * Extracted from useTemplateRenderer for separation of concerns.
 *
 * Reference: old-src/templateManager.js:1009-1150
 *
 * CRITICAL: Uses fresh tile blob data from server, NOT the already-overlayed canvas.
 * This ensures we compare against REAL server pixels, not our template overlay.
 */
export function usePixelProgress() {
  const templateStore = useTemplateStore();
  const db = useIndexedDB();

  async function countPixelProgress(ctx, tileBlob, matchingTemplates, tileCoords) {
    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────
    const SHREAD_SIZE = Template.SHREAD_SIZE;
    const SHREAD_CENTER = 1;
    const CANVAS_SIZE = Template.TILE_SIZE * SHREAD_SIZE;
    const ALPHA_THRESHOLD = 64;
    const DEFACE_COLOR = [222, 250, 206];

    // ─────────────────────────────────────────────────────────────
    // Initialize statistics
    // ─────────────────────────────────────────────────────────────
    const stats = {
      painted: 0,
      required: 0,
      wrong: 0,
      unpainted: 0,
      colorBreakdown: {},
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

      const templateBitmap = await createImageBitmap(templateTileBlob);
      const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(templateBitmap, 0, 0);

      const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const templatePixels = templateData.data;
      const templateWidth = templateData.width;
      const templateHeight = templateData.height;

      const offsetX = coords.pixelX * SHREAD_SIZE;
      const offsetY = coords.pixelY * SHREAD_SIZE;

      // ─────────────────────────────────────────────────────────────
      // Iterate template pixels (center of each 3x3 block only)
      // ─────────────────────────────────────────────────────────────
      for (let y = 0; y < templateHeight; y++) {
        for (let x = 0; x < templateWidth; x++) {
          const isCenterPixel =
            x % SHREAD_SIZE === SHREAD_CENTER && y % SHREAD_SIZE === SHREAD_CENTER;
          if (!isCenterPixel) continue;

          const gx = x + offsetX;
          const gy = y + offsetY;
          const inBounds = gx >= 0 && gy >= 0 && gx < CANVAS_SIZE && gy < CANVAS_SIZE;
          if (!inBounds) continue;

          const tIdx = (y * templateWidth + x) * 4;
          const tR = templatePixels[tIdx];
          const tG = templatePixels[tIdx + 1];
          const tB = templatePixels[tIdx + 2];
          const tA = templatePixels[tIdx + 3];

          if (tA < ALPHA_THRESHOLD) continue;

          const isDefaceColor =
            tR === DEFACE_COLOR[0] && tG === DEFACE_COLOR[1] && tB === DEFACE_COLOR[2];
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

          const sIdx = (gy * CANVAS_SIZE + gx) * 4;
          const sR = serverPixels[sIdx];
          const sG = serverPixels[sIdx + 1];
          const sB = serverPixels[sIdx + 2];
          const sA = serverPixels[sIdx + 3];

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

  return {
    countPixelProgress,
  };
}
