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
import { useIndexedDB } from '@/composables/useIndexedDB';
import { useStatusStore } from '@/stores/statusStore';

/**
 * Import/Export composable
 *
 * Handles JSON import/export for templates
 * Compatible with BlueMarble/SkirkMarble format
 * Reference: old-src/templateManager.js:1317-1413, 130-144
 */
export function useImportExport() {
  const templateStore = useTemplateStore();
  const db = useIndexedDB();
  const statusStore = useStatusStore();

  /**
   * Export templates to JSON
   * @param {number[]} templateIndices - Array of template indices to export (empty = all)
   * @returns {Promise<object>} JSON export object
   */
  async function exportTemplates(templateIndices = []) {
    const templatesToExport = templateIndices.length > 0
      ? templateIndices.map(i => templateStore.templates[i])
      : templateStore.templates;

    const exportData = {
      whoami: 'MarukyuMarble',
      scriptVersion: '2.0.0',
      schemaVersion: '1.0.0',  // Keep schema version consistent with BlueMarble/SkirkMarble
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      templateCount: templatesToExport.length,
      totalPixels: templatesToExport.reduce((sum, t) => sum + t.pixelCount, 0),
      templates: {}
    };

    // Export each template
    for (const template of templatesToExport) {
      const key = `${template.sortID} ${template.authorID}`;

      // Load all tile blobs from IndexedDB
      const tileKeys = await db.getTemplateTileKeys(template.id);
      const tiles = {};

      for (const tileKey of tileKeys) {
        const blob = await db.loadTile(template.id, tileKey);
        if (blob) {
          // Convert blob to base64
          const base64 = await blobToBase64(blob);
          tiles[tileKey] = base64;
        }
      }

      exportData.templates[key] = {
        name: template.displayName,
        coords: template.coords.join(','), // "tileX,tileY,pixelX,pixelY"
        createdAt: template.createdAt,
        pixelCount: template.pixelCount,
        validPixelCount: template.validPixelCount,
        transparentPixelCount: template.transparentPixelCount,
        enabled: template.enabled,
        disabledColors: Array.from(template.disabledColors),
        enhancedColors: Array.from(template.enhancedColors),
        tiles
      };
    }

    return exportData;
  }

  /**
   * Import templates from JSON
   * @param {object} json - JSON export object
   * @returns {Promise<{imported: number, skipped: number}>}
   */
  async function importTemplates(json) {
    if (!json || !json.templates) {
      throw new Error('Invalid JSON format');
    }

    // Validate whoami field
    if (!['MarukyuMarble', 'BlueMarble', 'SkirkMarble'].includes(json.whoami)) {
      throw new Error(`Unsupported format: ${json.whoami}`);
    }

    let imported = 0;
    let skipped = 0;

    for (const [key, templateData] of Object.entries(json.templates)) {
      try {
        // Parse key "sortID authorID"
        const [sortID, authorID] = key.split(' ');

        // Parse coordinates first for duplicate check
        const coords = templateData.coords.split(',').map(s => parseInt(s.trim()));

        // Check for duplicates (same name + pixel count + coordinates)
        // Templates with same name/pixels but different positions are NOT duplicates
        const duplicate = templateStore.templates.find(t =>
          t.displayName === templateData.name &&
          t.pixelCount === templateData.pixelCount &&
          t.coords[0] === coords[0] &&
          t.coords[1] === coords[1] &&
          t.coords[2] === coords[2] &&
          t.coords[3] === coords[3]
        );

        if (duplicate) {
          skipped++;
          continue;
        }

        // Build colorPalette from tiles (legacy compatibility)
        // Legacy never stores colorPalette in JSON - always rebuilds from tiles
        // Reference: old-src/templateManager.js:2125-2176 (buildColorPaletteFromTileProgress)
        let colorPalette = {};

        if (templateData.tiles) {
          for (const [tileKey, base64Data] of Object.entries(templateData.tiles)) {
            try {
              const blob = await base64ToBlob(base64Data);
              const bitmap = await createImageBitmap(blob);

              // Create temporary canvas to read pixel data
              const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(bitmap, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;

              // Scan colors matching legacy logic:
              // - Only center pixels of 3×3 blocks (x % 3 === 1, y % 3 === 1)
              // - Skip transparent (alpha < 64)
              // - Skip #deface (222, 250, 206)
              const DRAW_MULT = 3;  // drawMult from legacy

              for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                  // Only center of 3×3 blocks (legacy: x % drawMult !== 1 || y % drawMult !== 1)
                  if ((x % DRAW_MULT) !== 1 || (y % DRAW_MULT) !== 1) {
                    continue;
                  }

                  const idx = (y * canvas.width + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  const a = data[idx + 3];

                  // Skip transparent/semi-transparent (alpha < 64)
                  if (a < 64) continue;

                  // Skip #deface magic color (222, 250, 206)
                  if (r === 222 && g === 250 && b === 206) continue;

                  const colorKey = `${r},${g},${b}`;
                  colorPalette[colorKey] = (colorPalette[colorKey] || 0) + 1;
                }
              }
            } catch {
              // Ignore tile scan failures
            }
          }
        }

        // Create template instance
        const template = new Template({
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          displayName: templateData.name,
          sortID: parseInt(sortID),
          authorID: authorID,
          coords: coords,
          enabled: templateData.enabled ?? true,
          pixelCount: templateData.pixelCount,
          validPixelCount: templateData.validPixelCount,
          transparentPixelCount: templateData.transparentPixelCount,
          disabledColors: templateData.disabledColors || [],
          enhancedColors: templateData.enhancedColors || [],
          colorPalette: colorPalette,  // Use generated or provided palette
          createdAt: templateData.createdAt,
          updatedAt: new Date().toISOString()
        });

        // Import tiles to IndexedDB
        for (const [tileKey, base64Data] of Object.entries(templateData.tiles)) {
          const blob = await base64ToBlob(base64Data);
          await db.saveTile(template.id, tileKey, blob);
        }

        // Add to store
        await templateStore.addTemplate(template);
        imported++;
      } catch {
        skipped++;
      }
    }

    return { imported, skipped };
  }

  /**
   * Export single template to JSON file
   * @param {Template} template - Template instance to export
   */
  async function exportTemplate(template) {
    // Find template index
    const index = templateStore.templates.findIndex(t => t.id === template.id);
    if (index === -1) {
      throw new Error(`Template not found: ${template.id}`);
    }

    // Use sanitized filename
    const filename = `${template.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    await exportToFile([index], filename);
  }

  /**
   * Export to downloadable JSON file
   * @param {number[]} templateIndices - Template indices to export
   * @param {string} filename - Output filename
   */
  async function exportToFile(templateIndices = [], filename = 'marukyu-marble-templates.json') {
    try {
      const data = await exportTemplates(templateIndices);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const count = templateIndices.length || templateStore.templates.length;
      statusStore.handleDisplayStatus(`Exported ${count} template(s) to ${filename}`);
    } catch (error) {
      statusStore.handleDisplayError(`Failed to export templates`);
      throw error;
    }
  }

  /**
   * Import from uploaded JSON file
   * @param {File} file - JSON file
   * @returns {Promise<{imported: number, skipped: number}>}
   */
  async function importFromFile(file) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await importTemplates(json);

      if (result.imported > 0) {
        statusStore.handleDisplayStatus(`Imported ${result.imported} template(s) from ${file.name}!`);
      } else if (result.skipped > 0) {
        statusStore.handleDisplayStatus(`No new templates imported (${result.skipped} duplicates skipped)`);
      }

      return result;
    } catch (error) {
      statusStore.handleDisplayError(`Failed to import JSON - please check the file format`);
      throw error;
    }
  }

  /**
   * Convert Blob to base64 string (raw base64 without data URL prefix)
   * Compatible with BlueMarble/SkirkMarble format
   * @param {Blob} blob
   * @returns {Promise<string>}
   */
  async function blobToBase64(blob) {
    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert Uint8Array to binary string
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }

      // Encode to base64 (no data URL prefix)
      return btoa(binary);
    } catch (error) {
      // Fallback to FileReader if ArrayBuffer fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove data URL prefix (data:image/png;base64,)
          const dataUrl = reader.result;
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  }

  /**
   * Convert base64 string to Blob (handles raw base64 without data URL prefix)
   * Compatible with BlueMarble/SkirkMarble format
   * @param {string} base64
   * @returns {Promise<Blob>}
   */
  async function base64ToBlob(base64) {
    try {
      // Check if base64 has data URL prefix
      const base64Data = base64.startsWith('data:') ? base64.split(',')[1] : base64;

      // Decode base64 to binary string
      const binary = atob(base64Data);

      // Convert binary string to Uint8Array
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }

      // Create blob
      return new Blob([array], { type: 'image/png' });
    } catch {
      throw new Error('Failed to convert base64 to blob');
    }
  }

  return {
    exportTemplates,
    exportTemplate,
    importTemplates,
    exportToFile,
    importFromFile
  };
}
