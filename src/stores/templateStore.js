import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Template } from '@/models/Template';
import { useIndexedDB } from '@/composables/useIndexedDB';
import { useStatusStore } from '@/stores/statusStore';

export const useTemplateStore = defineStore('template', () => {
  // State
  const templates = ref([]);  // Array<Template>
  const currentTemplateIndex = ref(-1);  // Selected template for UI
  const tileProgress = ref(new Map());  // Map<tileCoords, ProgressStats>
  const isLoading = ref(false);
  const error = ref(null);
  const templatesShouldBeDrawn = ref(true);  // Should templates be drawn? (legacy: templateManager.templatesShouldBeDrawn)

  // IndexedDB composable
  const db = useIndexedDB();

  // Status store (lazy loaded to avoid circular dependency)
  let statusStore = null;
  function getStatusStore() {
    if (!statusStore) {
      statusStore = useStatusStore();
    }
    return statusStore;
  }

  // Computed
  const enabledTemplates = computed(() => {
    return templates.value.filter(t => t.enabled);
  });

  const sortedTemplates = computed(() => {
    return [...templates.value].sort((a, b) => a.sortID - b.sortID);
  });

  const currentTemplate = computed(() => {
    return templates.value[currentTemplateIndex.value] || null;
  });

  // Actions

  /**
   * Load templates from chrome.storage.sync
   */
  async function loadTemplates() {
    isLoading.value = true;
    error.value = null;

    try {
      // Load metadata from chrome.storage.sync
      const result = await chrome.storage.sync.get('templates');
      if (result.templates) {
        templates.value = result.templates.map(t => Template.fromJSON(t));
      }

    } catch (e) {
      error.value = `Failed to load templates: ${e.message}`;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Save templates to chrome.storage.sync
   */
  async function saveTemplates() {
    try {
      // Save metadata only (no blobs)
      const metadata = templates.value.map(t => t.toJSON());

      // Deep clone via JSON to ensure structured clone compatibility
      // This removes any non-serializable properties that might cause postMessage to fail
      const cleanMetadata = JSON.parse(JSON.stringify(metadata));

      await chrome.storage.sync.set({ templates: cleanMetadata });
    } catch (e) {
      error.value = `Failed to save templates: ${e.message}`;
      throw e;
    }
  }

  /**
   * Add a new template
   * @param {Template} template - Template instance
   * @param {Map|Object} tiles - Optional tiles Map or object {tileKey: blob}
   */
  async function addTemplate(template, tiles = null) {
    try {
      // Step 1: Add to templates array first (can be easily rolled back)
      templates.value.push(template);

      // Step 2: Save metadata to chrome.storage.sync (validate before heavy IndexedDB operations)
      await saveTemplates();

      // Step 3: Save tiles to IndexedDB (only after metadata is confirmed saved)
      if (tiles) {
        const tilesIterable = tiles instanceof Map ? tiles : Object.entries(tiles);
        for (const [tileKey, blob] of tilesIterable) {
          await db.saveTile(template.id, tileKey, blob);
        }
      }
    } catch (error) {
      // Rollback: Remove from templates array if save failed
      const index = templates.value.findIndex(t => t.id === template.id);
      if (index !== -1) {
        templates.value.splice(index, 1);
      }

      // Attempt to clean up any partially saved tiles from IndexedDB
      try {
        await db.deleteTemplateTiles(template.id);
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Delete a template
   * @param {number} index - Template index in array
   */
  async function deleteTemplate(index) {
    const template = templates.value[index];
    const templateName = template.displayName;

    try {
      // Delete tile blobs from IndexedDB
      await db.deleteTemplateTiles(template.id);

      // Remove from array
      templates.value.splice(index, 1);

      // Clear tile progress cache
      tileProgress.value.clear();

      await saveTemplates();

      getStatusStore().handleDisplayStatus(`Successfully deleted template "${templateName}"`);
    } catch (e) {
      getStatusStore().handleDisplayError(`Failed to delete template. Check console for details.`);
      throw e;
    }
  }

  /**
   * Set template enabled/disabled
   * @param {number} index - Template index
   * @param {boolean} enabled - New enabled state
   */
  async function setTemplateEnabled(index, enabled) {
    if (index < 0 || index >= templates.value.length) return;

    const templateName = templates.value[index].displayName;
    templates.value[index].enabled = enabled;
    tileProgress.value.clear();
    await saveTemplates();

    getStatusStore().handleDisplayStatus(`${enabled ? 'Enabled' : 'Disabled'} template "${templateName}"!`);
  }

  /**
   * Rename a template by index
   * @param {number} index - Template index
   * @param {string} newName - New display name
   */
  async function renameTemplate(index, newName) {
    if (index < 0 || index >= templates.value.length) return;

    templates.value[index].displayName = newName;
    templates.value[index].updatedAt = new Date().toISOString();
    await saveTemplates();

    getStatusStore().handleDisplayStatus(`Renamed to "${newName}"`);
  }

  /**
   * Rename a template by ID
   * @param {string} id - Template ID
   * @param {string} newName - New display name
   */
  async function renameTemplateById(id, newName) {
    const index = templates.value.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template not found: ${id}`);
    }
    await renameTemplate(index, newName);
  }

  /**
   * Update template enabled state by ID
   * @param {string} id - Template ID
   * @param {boolean} enabled - New enabled state
   */
  async function updateTemplateState(id, enabled) {
    const index = templates.value.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template not found: ${id}`);
    }
    await setTemplateEnabled(index, enabled);
  }

  /**
   * Update template color filters
   * @param {number} index - Template index
   * @param {string[]} disabledColors - Array of "r,g,b" strings
   * @param {string[]} enhancedColors - Array of "r,g,b" strings
   */
  async function updateTemplateColors(index, disabledColors, enhancedColors) {
    if (index < 0 || index >= templates.value.length) return;

    templates.value[index].disabledColors = new Set(disabledColors);
    templates.value[index].enhancedColors = new Set(enhancedColors);
    templates.value[index].updatedAt = new Date().toISOString();
    tileProgress.value.clear();
    await saveTemplates();
  }

  /**
   * Set tile progress statistics
   * @param {string} tileCoords - Tile coordinates as "x,y"
   * @param {object} stats - Progress statistics
   */
  function setTileProgress(tileCoords, stats) {
    tileProgress.value.set(tileCoords, stats);
  }

  /**
   * Clear tile progress cache
   */
  function clearTileProgress() {
    tileProgress.value.clear();
  }

  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Template|null}
   */
  function getTemplateById(id) {
    return templates.value.find(t => t.id === id) || null;
  }

  /**
   * Set current template index
   * @param {number} index - Template index
   */
  function setCurrentTemplateIndex(index) {
    if (index >= -1 && index < templates.value.length) {
      currentTemplateIndex.value = index;
    }
  }

  return {
    // State
    templates,
    currentTemplateIndex,
    tileProgress,
    isLoading,
    error,
    templatesShouldBeDrawn,

    // Computed
    enabledTemplates,
    sortedTemplates,
    currentTemplate,

    // Actions
    loadTemplates,
    saveTemplates,
    addTemplate,
    deleteTemplate,
    setTemplateEnabled,
    renameTemplate,
    renameTemplateById,
    updateTemplateState,
    updateTemplateColors,
    setTileProgress,
    clearTileProgress,
    getTemplateById,
    setCurrentTemplateIndex
  };
});
