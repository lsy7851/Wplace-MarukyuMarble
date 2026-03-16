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
import { computed } from 'vue';
import { useServerStore } from '@/stores/serverStore';
import { useIndexedDB } from '@/composables/storage/useIndexedDB';
import { useStatusStore } from '@/stores/statusStore';

/**
 * Screenshot composable
 * Handles fetching raw tiles and stitching them for template area screenshots
 */
export function useScreenshot() {
  const serverStore = useServerStore();
  const db = useIndexedDB();
  const statusStore = useStatusStore();

  /**
   * Take a high-res screenshot of the template area by fetching tiles from server
   * @param {Object} template - The template object
   * @returns {Promise<Blob>} PNG blob of the screenshot
   */
  async function takeTemplateScreenshot(template) {
    const tileServerBase = serverStore.tileServerBaseUrl;

    if (!tileServerBase) {
      throw new Error('Tile server URL not detected yet. Please explore the map first.');
    }

    if (!template) {
      throw new Error('No template provided for screenshot.');
    }

    // Extract info from template
    const { coords } = template;

    // Handle different template coordinate formats if necessary
    // Assuming [tileX, tileY, pixelX, pixelY] format
    if (!Array.isArray(coords) || coords.length < 4) {
      throw new Error('Invalid template coordinates.');
    }

    const [ tx, ty, px, py ] = coords.map(Number);
    // Use stored image dimensions, or fallback to something reasonable if missing
    // (In new system, width/height should be on the template object)
    // If using the Template class from models/Template.js, it might calculate these.

    // Check if we need to calculate width/height from chunked data if explicit sizing is missing
    // Legacy code used 'imageWidth' and 'imageHeight' properties which were transient.
    let width = template.imageWidth;
    let height = template.imageHeight;

    const tileSize = 1000; // Standard Wplace tile size

    if (!width || !height) {
      // Fallback: estimate from pixelCount or assume standard size if not found?
      // Try to detect from IndexedDB tiles if available (for legacy templates)
      try {
        const tileKeys = await db.getTemplateTileKeys(template.id);

        if (tileKeys && tileKeys.length > 0) {
          let minX = Infinity, minY = Infinity;
          let maxX = -Infinity, maxY = -Infinity;
          const DISK_DRAW_MULT = 3;

          // First pass: Find min/max starts to reduce blob loading
          // Keys are "tX,tY,pX,pY" -> Start pos is (tX * 1000 + pX) * DRAW_MULT

          // We need to load blobs for the "edge" tiles to get their widths.
          // For safety and simplicity, we'll just scan keys to find the extremes,
          // then load ALL tiles at those extremes (unlikely to be many).

          // Group keys by their X and Y start positions
          const xStarts = new Set();
          const yStarts = new Set();

          const parsedKeys = tileKeys.map(k => {
            const parts = k.split(',').map(Number);
            // Global 3x coordinate start
            const startX = (parts[0] * 1000 + parts[2]) * DISK_DRAW_MULT;
            const startY = (parts[1] * 1000 + parts[3]) * DISK_DRAW_MULT;
            return { key: k, startX, startY };
          });

          if (parsedKeys.length > 0) {
            parsedKeys.sort((a, b) => a.startX - b.startX);
            const minStartX = parsedKeys[0].startX;
            const maxStartX = parsedKeys[parsedKeys.length - 1].startX;

            parsedKeys.sort((a, b) => a.startY - b.startY);
            const minStartY = parsedKeys[0].startY;
            const maxStartY = parsedKeys[parsedKeys.length - 1].startY;

            minX = minStartX; // Min X is just the start of the left-most tile
            minY = minStartY;

            // To find max X/Y, we need (start + width).
            // Identify tiles that start at maxStartX and maxStartY
            // (There could be others that start earlier but extend further, but assuming minimal overlap/standard processing)
            const edgeTiles = parsedKeys.filter(p =>
              p.startX === maxStartX || p.startY === maxStartY ||
              p.startX === minStartX || p.startY === minStartY, // Load mins too just to be sure of top-left alignment
            );

            // Load blobs for edge tiles
            for (const p of edgeTiles) {
              const blob = await db.loadTile(template.id, p.key);
              if (blob) {
                const bitmap = await createImageBitmap(blob);
                const endX = p.startX + bitmap.width;
                const endY = p.startY + bitmap.height;
                if (endX > maxX) maxX = endX;
                if (endY > maxY) maxY = endY;
              }
            }

            if (maxX > minX && maxY > minY) {
              width = Math.round((maxX - minX) / DISK_DRAW_MULT);
              height = Math.round((maxY - minY) / DISK_DRAW_MULT);

              // Use local variables, don't persist to template model to match legacy structure
              // But we can attach them transiently like legacy did
              width = Math.round((maxX - minX) / DISK_DRAW_MULT);
              height = Math.round((maxY - minY) / DISK_DRAW_MULT);

              // Transiently set them so we don't recalculate next time in this session (optional)
              // template.imageWidth = width;
              // template.imageHeight = height;

            }
          }
        }
      } catch {
        // Ignore calculation errors
      }

      if (!width || !height) {
        throw new Error('Template dimensions (width/height) are missing and could not be calculated.');
      }
    }

    // Calculate bounds in global pixels
    const startX = tx * tileSize + px;
    const startY = ty * tileSize + py;
    const endX = startX + width;
    const endY = startY + height;

    // Determine tile range
    const tileStartX = Math.floor(startX / tileSize);
    const tileStartY = Math.floor(startY / tileSize);
    const tileEndX = Math.floor((endX - 1) / tileSize);
    const tileEndY = Math.floor((endY - 1) / tileSize);

    const canvasW = endX - startX;
    const canvasH = endY - startY;

    // Setup canvas
    const canvas = new OffscreenCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Fetch and draw tiles
    const promises = [];

    for (let currentTy = tileStartY; currentTy <= tileEndY; currentTy++) {
      for (let currentTx = tileStartX; currentTx <= tileEndX; currentTx++) {
        promises.push(
          fetchTileAndDraw(
            currentTx,
            currentTy,
            tileServerBase,
            ctx,
            startX,
            startY,
            tileSize,
            canvasW,
            canvasH,
          ),
        );
      }
    }

    await Promise.all(promises);

    return await canvas.convertToBlob({ type: 'image/png' });
  }

  /**
   * Take screenshot and download as file
   * @param {Object} template - The template object
   * @returns {Promise<void>}
   */
  async function saveTemplateScreenshot(template) {
    try {
      const blob = await takeTemplateScreenshot(template);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${template.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_screenshot.png`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const [ tx, ty, px, py ] = template.coords;
      const width = template.imageWidth || '?';
      const height = template.imageHeight || '?';
      statusStore.handleDisplayStatus(`📸 Saved template area screenshot!\nLocation: Tile ${tx},${ty} • Pixel ${px},${py}\nSize: ${width}×${height}px`);
    } catch (error) {
      statusStore.handleDisplayError(`Failed to save screenshot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper to fetch a single tile and draw specific part of it to canvas
   */
  async function fetchTileAndDraw(tx, ty, baseUrl, ctx, globalStartX, globalStartY, tileSize, canvasW, canvasH) {
    const url = `${baseUrl}/${tx}/${ty}.png?raw=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch tile ${tx},${ty}`);

      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      // Calculate overlap
      const tileOriginX = tx * tileSize;
      const tileOriginY = ty * tileSize;

      // Source rect (part of the tile we want)
      const srcX = Math.max(0, globalStartX - tileOriginX);
      const srcY = Math.max(0, globalStartY - tileOriginY);

      // Dest rect (where on canvas)
      const dstX = Math.max(0, tileOriginX - globalStartX);
      const dstY = Math.max(0, tileOriginY - globalStartY);

      // Width/Height to draw
      const drawW = Math.min(tileSize - srcX, canvasW - dstX);
      const drawH = Math.min(tileSize - srcY, canvasH - dstY);

      if (drawW > 0 && drawH > 0) {
        ctx.drawImage(bitmap, srcX, srcY, drawW, drawH, dstX, dstY, drawW, drawH);
      }

    } catch {
      // Continue without this tile (will be transparent)
    }
  }

  return {
    takeTemplateScreenshot,
    saveTemplateScreenshot,
  };
}
