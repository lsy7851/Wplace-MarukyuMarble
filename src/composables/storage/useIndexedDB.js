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
import { openDB } from 'idb';

const DB_NAME = 'marukyu-marble';
const DB_VERSION = 1;
const TILES_STORE = 'template-tiles';

/**
 * IndexedDB storage composable for template tiles
 *
 * Stores binary tile blobs in IndexedDB to avoid:
 * - localStorage 5-10MB limits
 * - base64 encoding overhead (33% size increase)
 * - Synchronous storage blocking UI
 *
 * Key format: "templateId:tileKey"
 * Value: { blob: Blob, createdAt: timestamp }
 */
export function useIndexedDB() {
  let dbInstance = null;

  /**
   * Get or initialize database connection
   * @returns {Promise<IDBDatabase>}
   */
  async function getDB() {
    if (dbInstance) return dbInstance;

    try {
      dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Template tiles store
          // Key: "templateId:tileKey"
          // Value: { blob: Blob, createdAt: timestamp }
          if (!db.objectStoreNames.contains(TILES_STORE)) {
            db.createObjectStore(TILES_STORE);
          }
        }
      });

      return dbInstance;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Save template tile blob
   * @param {string} templateId - Template ID
   * @param {string} tileKey - Tile coordinates (e.g., "0000,0000,000,000")
   * @param {Blob} blob - PNG blob
   * @returns {Promise<void>}
   */
  async function saveTile(templateId, tileKey, blob) {
    if (!templateId || !tileKey || !blob) {
      throw new Error('Invalid parameters for saveTile');
    }

    try {
      const db = await getDB();
      const key = `${templateId}:${tileKey}`;
      await db.put(TILES_STORE, {
        blob,
        createdAt: Date.now()
      }, key);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Load template tile blob
   * @param {string} templateId - Template ID
   * @param {string} tileKey - Tile coordinates
   * @returns {Promise<Blob|null>}
   */
  async function loadTile(templateId, tileKey) {
    if (!templateId || !tileKey) {
      throw new Error('Invalid parameters for loadTile');
    }

    try {
      const db = await getDB();
      const key = `${templateId}:${tileKey}`;
      const data = await db.get(TILES_STORE, key);

      if (data?.blob) {
        return data.blob;
      }

      return null;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Delete all tiles for a template
   * @param {string} templateId - Template ID
   * @returns {Promise<number>} Number of tiles deleted
   */
  async function deleteTemplateTiles(templateId) {
    if (!templateId) {
      throw new Error('Invalid templateId for deleteTemplateTiles');
    }

    try {
      const db = await getDB();
      const prefix = `${templateId}:`;
      let deletedCount = 0;

      const tx = db.transaction(TILES_STORE, 'readwrite');
      const store = tx.objectStore(TILES_STORE);

      let cursor = await store.openCursor();
      while (cursor) {
        // Ensure key is string before comparing
        const key = String(cursor.key);
        if (key.startsWith(prefix)) {
          await cursor.delete();
          deletedCount++;
        }
        cursor = await cursor.continue();
      }

      await tx.done;
      return deletedCount;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get all tile keys for a template
   * @param {string} templateId - Template ID
   * @returns {Promise<string[]>} Array of tile keys
   */
  async function getTemplateTileKeys(templateId) {
    if (!templateId) {
      throw new Error('Invalid templateId for getTemplateTileKeys');
    }

    try {
      const db = await getDB();
      const prefix = `${templateId}:`;
      const keys = [];

      let cursor = await db.transaction(TILES_STORE).store.openCursor();
      while (cursor) {
        // Ensure key is string before comparing
        const key = String(cursor.key);
        if (key.startsWith(prefix)) {
          // Extract tileKey from "templateId:tileKey"
          keys.push(key.substring(prefix.length));
        }
        cursor = await cursor.continue();
      }

      return keys;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get database storage statistics
   * @returns {Promise<{tileCount: number, totalSize: number}>}
   */
  async function getStorageStats() {
    try {
      const db = await getDB();
      let tileCount = 0;
      let totalSize = 0;

      let cursor = await db.transaction(TILES_STORE).store.openCursor();
      while (cursor) {
        tileCount++;
        if (cursor.value?.blob) {
          totalSize += cursor.value.blob.size;
        }
        cursor = await cursor.continue();
      }

      return {
        tileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (e) {
      throw e;
    }
  }

  /**
   * Clear all template tiles (use with caution!)
   * @returns {Promise<void>}
   */
  async function clearAllTiles() {
    try {
      const db = await getDB();
      await db.clear(TILES_STORE);
    } catch (e) {
      throw e;
    }
  }

  return {
    getDB,
    saveTile,
    loadTile,
    deleteTemplateTiles,
    getTemplateTileKeys,
    getStorageStats,
    clearAllTiles
  };
}
