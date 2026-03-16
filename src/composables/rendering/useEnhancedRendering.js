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
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Enhanced rendering composable
 *
 * Handles crosshair drawing and wrong color detection for template pixels.
 * Extracted from useTemplateRenderer for separation of concerns.
 *
 * Reference: old-src/templateManager.js:662-1006
 */
export function useEnhancedRendering() {
  const settingsStore = useSettingsStore();

  /**
   * Enhanced rendering: crosshairs + wrong color detection
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
    const SHREAD_CENTER = 1;
    const ALPHA_THRESHOLD = 64;
    const BORDER_COLOR = [0, 100, 255, 255];

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

    const originalPixels = new Uint8ClampedArray(templatePixels);

    const enhancedPixels = new Set();
    const wrongColorPixels = new Set();

    // ─────────────────────────────────────────────────────────────
    // Phase 1: Identify enhanced pixels and apply color filtering
    // ─────────────────────────────────────────────────────────────
    for (let y = 0; y < templateHeight; y++) {
      for (let x = 0; x < templateWidth; x++) {
        const isCenterPixel =
          x % SHREAD_SIZE === SHREAD_CENTER && y % SHREAD_SIZE === SHREAD_CENTER;
        if (!isCenterPixel) continue;

        const idx = (y * templateWidth + x) * 4;
        const tR = templatePixels[idx];
        const tG = templatePixels[idx + 1];
        const tB = templatePixels[idx + 2];
        const tA = templatePixels[idx + 3];
        const templateRGB = [tR, tG, tB];

        if (tA < ALPHA_THRESHOLD) continue;

        if (template.isColorDisabled(templateRGB)) {
          templatePixels[idx + 3] = 0;
          continue;
        }

        if (template.isColorEnhanced(templateRGB)) {
          enhancedPixels.add(`${x},${y}`);
        }

        if (settingsStore.enhanceWrongColors) {
          const canvasX = x + offsetX;
          const canvasY = y + offsetY;
          const inBounds =
            canvasX >= 0 && canvasY >= 0 && canvasX < canvasData.width && canvasY < canvasData.height;

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

    const crosshairColor = settingsStore.crosshairColor || { rgb: [255, 0, 0], alpha: 255 };
    const showBorder = settingsStore.crosshairBorder || false;
    const enhancedSizeEnabled = settingsStore.crosshairEnhancedSize || false;
    const crosshairRadius = settingsStore.crosshairRadius || 256;

    const BASE_OFFSETS = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    const CORNER_OFFSETS = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];

    for (const pixelKey of enhancedPixels) {
      const [px, py] = pixelKey.split(',').map(Number);
      const isWrongColor = wrongColorPixels.has(pixelKey);

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
          const inBounds =
            cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height;
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

        const cx = nx + offsetX;
        const cy = ny + offsetY;
        const inBounds = cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height;
        const isPainted = inBounds && canvasData.data[(cy * canvasData.width + cx) * 4 + 3] > 0;

        if (!isPainted || isWrongColor) {
          templatePixels[nIdx] = crosshairColor.rgb[0];
          templatePixels[nIdx + 1] = crosshairColor.rgb[1];
          templatePixels[nIdx + 2] = crosshairColor.rgb[2];
          templatePixels[nIdx + 3] = crosshairColor.alpha || 255;
        }
      }

      // Draw corner borders
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
          const inBounds =
            cx >= 0 && cy >= 0 && cx < canvasData.width && cy < canvasData.height;
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
    // Finalize
    // ─────────────────────────────────────────────────────────────
    tempCtx.putImageData(templateData, 0, 0);
    ctx.drawImage(tempCanvas, offsetX, offsetY);
  }

  return {
    renderTemplateWithEnhancement,
  };
}
