import { Template } from '@/models/Template';
import { useIndexedDB } from './useIndexedDB';

/**
 * Image processing composable for template chunking
 *
 * Converts uploaded images into 1000×1000 pixel tiles with 3×3 shread system
 * Reference: old-src/Template.js:55-303
 */
export function useImageProcessing() {
  const db = useIndexedDB();

  /**
   * Process uploaded image into template tiles
   * @param {File|Blob} file - Image file
   * @param {Array} coords - [tileX, tileY, pixelX, pixelY]
   * @param {Object} options - { onProgress }
   * @returns {Promise<{tiles, pixelCount, validPixelCount, transparentPixelCount, colorPalette}>}
   */
  async function createTemplateTiles(file, coords, options = {}) {
    const { onProgress } = options;
    console.log(`Processing image: ${file.name || 'blob'} (${(file.size / 1024).toFixed(2)} KB)`);

    // STEP 1: Create ImageBitmap
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      console.log(`ImageBitmap created: ${bitmap.width}×${bitmap.height}`);
    } catch (e) {
      console.warn('createImageBitmap failed, using fallback:', e);
      bitmap = await loadImageViaCanvas(file);
    }

    const { width, height } = bitmap;
    const [baseTileX, baseTileY, basePixelX, basePixelY] = coords;

    // STEP 2: Count pixels and build color palette
    let totalPixels = 0;
    let validPixels = 0;
    let transparentPixels = 0;
    const colorPalette = {};

    // Quick pixel count using temporary canvas
    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(bitmap, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      totalPixels++;
      if (alpha >= 64) {
        validPixels++;

        // Build color palette
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const colorKey = `${r},${g},${b}`;
        colorPalette[colorKey] = (colorPalette[colorKey] || 0) + 1;
      } else {
        transparentPixels++;
      }
    }

    console.log(`Pixel analysis: total=${totalPixels}, valid=${validPixels}, transparent=${transparentPixels}`);
    console.log(`Color palette: ${Object.keys(colorPalette).length} unique colors`);

    // STEP 3: Chunk into tiles
    // Uses world coordinates (absolute pixel positions) like old-src
    const TILE_SIZE = Template.TILE_SIZE;  // 1000
    const SHREAD_SIZE = Template.SHREAD_SIZE;  // 3

    // Create temporary template object for color filtering
    const tempTemplate = {
      isColorDisabled: () => false  // No color filtering on initial creation
    };

    const tiles = new Map();
    let processedTiles = 0;

    // Calculate estimated tile count
    const startPixelX = basePixelX;
    const startPixelY = basePixelY;
    const endPixelX = basePixelX + width;
    const endPixelY = basePixelY + height;
    const estimatedTilesX = Math.ceil((endPixelX - startPixelX) / TILE_SIZE);
    const estimatedTilesY = Math.ceil((endPixelY - startPixelY) / TILE_SIZE);
    const estimatedTiles = estimatedTilesX * estimatedTilesY;

    console.log(`Chunking into ~${estimatedTiles} tiles (${estimatedTilesX}×${estimatedTilesY})`);

    // Loop using world coordinates (like old-src)
    for (let pixelY = basePixelY; pixelY < basePixelY + height; ) {
      // Calculate how much to draw in Y direction
      // Min of: remaining space in current tile OR remaining image height
      const drawSizeY = Math.min(
        TILE_SIZE - (pixelY % TILE_SIZE),
        height - (pixelY - basePixelY)
      );

      for (let pixelX = basePixelX; pixelX < basePixelX + width; ) {
        // Calculate how much to draw in X direction
        // Min of: remaining space in current tile OR remaining image width
        const drawSizeX = Math.min(
          TILE_SIZE - (pixelX % TILE_SIZE),
          width - (pixelX - basePixelX)
        );

        // Create canvas with 3× scaling (shread system)
        const canvas = new OffscreenCanvas(
          drawSizeX * SHREAD_SIZE,
          drawSizeY * SHREAD_SIZE
        );
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false; // Nearest neighbor

        // Draw image segment enlarged 3×
        // Source: image coordinates (relative to image origin)
        // Dest: canvas coordinates (0,0)
        ctx.drawImage(
          bitmap,
          pixelX - basePixelX,       // source X (image coords)
          pixelY - basePixelY,       // source Y (image coords)
          drawSizeX,                 // source width
          drawSizeY,                 // source height
          0, 0,                      // dest position
          drawSizeX * SHREAD_SIZE,   // dest width (3×)
          drawSizeY * SHREAD_SIZE    // dest height (3×)
        );

        // STEP 4: Process pixels (shread + filters)
        await processPixels(ctx, canvas, tempTemplate);

        // STEP 5: Generate tile key using world coordinates
        const currentTileX = baseTileX + Math.floor(pixelX / TILE_SIZE);
        const currentTileY = baseTileY + Math.floor(pixelY / TILE_SIZE);
        const pixelOffsetX = pixelX % TILE_SIZE;
        const pixelOffsetY = pixelY % TILE_SIZE;

        const tileKey = Template.getTileKey(
          currentTileX,
          currentTileY,
          pixelOffsetX,
          pixelOffsetY
        );

        // STEP 6: Convert to blob and store in tiles Map
        const tileBlob = await canvas.convertToBlob({ type: 'image/png' });
        tiles.set(tileKey, tileBlob);

        // Progress callback
        processedTiles++;
        if (onProgress) {
          const progress = Math.round((processedTiles / estimatedTiles) * 100);
          onProgress(progress);
        }

        // Advance X by what we drew
        pixelX += drawSizeX;
      }

      // Advance Y by what we drew
      pixelY += drawSizeY;
    }

    console.log(`Chunking complete: ${processedTiles} tiles created`);

    return {
      tiles,
      pixelCount: totalPixels,
      validPixelCount: validPixels,
      transparentPixelCount: transparentPixels,
      colorPalette
    };
  }

  /**
   * Process pixels: shread + color filtering + #deface pattern
   * Reference: old-src/Template.js:164-298
   */
  async function processPixels(ctx, canvas, template) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const SHREAD_SIZE = Template.SHREAD_SIZE;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Skip transparent pixels
        if (a < 64) {
          data[idx + 3] = 0;
          continue;
        }

        // Check disabled colors
        if (template.isColorDisabled([r, g, b])) {
          data[idx + 3] = 0;  // Make transparent
          continue;
        }

        // Handle #deface (222, 250, 206) - checkerboard pattern
        if (r === 222 && g === 250 && b === 206) {
          if ((x + y) % 2 === 0) {
            data[idx + 3] = 0;  // Make transparent (checkerboard)
          }
          continue;
        }

        // Shread system: keep only center pixel of 3×3 blocks
        // Center pixel is at (1, 1) in each 3×3 block
        if (x % SHREAD_SIZE === 1 && y % SHREAD_SIZE === 1) {
          // Keep pixel (center of 3×3 block)
          data[idx + 3] = a;
        } else {
          // Make transparent (non-center pixels)
          data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Fallback: Load image via Image element + Canvas
   * Used when createImageBitmap() fails
   */
  async function loadImageViaCanvas(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        createImageBitmap(canvas)
          .then(resolve)
          .catch(reject);

        // Clean up
        URL.revokeObjectURL(img.src);
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image: ' + e));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Apply color filter to existing tiles
   * Used when user changes color filters after upload
   * @param {Template} template - Template instance
   * @param {Function} onProgress - Progress callback
   */
  async function applyColorFilterToExistingTiles(template, onProgress) {
    console.log(`Applying color filter to existing tiles for template ${template.id}`);

    const tileKeys = await db.getTemplateTileKeys(template.id);
    const totalTiles = tileKeys.length;
    let processedTiles = 0;

    for (const tileKey of tileKeys) {
      // Load tile blob
      const blob = await db.loadTile(template.id, tileKey);
      if (!blob) continue;

      // Convert to ImageBitmap
      const bitmap = await createImageBitmap(blob);

      // Create canvas
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);

      // Re-apply pixel processing with new filters
      await processPixels(ctx, canvas, template);

      // Save updated tile
      const newBlob = await canvas.convertToBlob({ type: 'image/png' });
      await db.saveTile(template.id, tileKey, newBlob);

      // Progress
      processedTiles++;
      if (onProgress) {
        onProgress(Math.round((processedTiles / totalTiles) * 100));
      }
    }

    console.log(`Color filter applied to ${processedTiles} tiles`);
  }

  return {
    createTemplateTiles,
    applyColorFilterToExistingTiles
  };
}
