<script setup>
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
import { ref, computed } from 'vue';
import { useTemplateStore } from '@/stores/templateStore';
import { useNavigation } from '@/composables/ui/useNavigation';
import { useCoordinateStore } from '@/stores/coordinateStore';
import { useImportExport } from '@/composables/features/useImportExport';
import BaseModal from './BaseModal.vue';
import * as icons from '@@/old-src/icons.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const templateStore = useTemplateStore();
const { flyToCoordinates } = useNavigation();
const coordinateStore = useCoordinateStore();
const { exportTemplate } = useImportExport();

// Local state
const editingTemplateId = ref(null);
const editingTemplateName = ref('');

/**
 * Start inline rename
 */
function startRename(template) {
  editingTemplateId.value = template.id;
  editingTemplateName.value = template.displayName;
}

/**
 * Finish inline rename
 */
async function finishRename(template, commit = true) {
  if (!commit || !editingTemplateName.value.trim()) {
    editingTemplateId.value = null;
    return;
  }

  const newName = editingTemplateName.value.trim();
  if (newName !== template.displayName) {
    try {
      await templateStore.renameTemplateById(template.id, newName);
    } catch (error) {
      alert(`Failed to rename template: ${error.message}`);
    }
  }

  editingTemplateId.value = null;
}

/**
 * Handle rename input key events
 */
function handleRenameKeydown(event, template) {
  if (event.key === 'Enter') {
    event.preventDefault();
    finishRename(template, true);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    finishRename(template, false);
  }
}

/**
 * Toggle template enabled state
 */
async function toggleTemplate(template) {
  const newState = !template.enabled;
  await templateStore.updateTemplateState(template.id, newState);
}

/**
 * Fly to template coordinates
 */
function flyToTemplate(template) {
  const [tileX, tileY, pixelX, pixelY] = template.coords;

  // Auto-fill coordinate inputs
  coordinateStore.inputTileX = String(tileX);
  coordinateStore.inputTileY = String(tileY);
  coordinateStore.inputPixelX = String(pixelX);
  coordinateStore.inputPixelY = String(pixelY);

  // Navigate to coordinates
  flyToCoordinates(template.coords);

  // Close modal
  emit('update:modelValue', false);
}

/**
 * Export template as JSON
 */
async function handleExportTemplate(template) {
  try {
    await exportTemplate(template);
  } catch (error) {
    alert(`Failed to export template: ${error.message}`);
  }
}

/**
 * Delete template with confirmation
 */
async function deleteTemplate(template) {
  const confirmed = confirm(`Delete "${template.displayName}"?\n\nThis action cannot be undone!`);

  if (confirmed) {
    try {
      const index = templateStore.templates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        await templateStore.deleteTemplate(index);
        if (templateStore.templates.length === 0) {
          emit('update:modelValue', false);
        }
      }
    } catch (error) {
      alert(`Failed to delete template: ${error.message}`);
    }
  }
}

/**
 * Enable all templates
 */
async function enableAllTemplates() {
  for (const template of templateStore.templates) {
    if (!template.enabled) {
      await templateStore.updateTemplateState(template.id, true);
    }
  }
}

/**
 * Disable all templates
 */
async function disableAllTemplates() {
  for (const template of templateStore.templates) {
    if (template.enabled) {
      await templateStore.updateTemplateState(template.id, false);
    }
  }
}

/**
 * Format coordinates for display
 */
function formatCoords(coords) {
  if (!coords || coords.length !== 4) return 'Unknown location';
  const [tileX, tileY, pixelX, pixelY] = coords;
  return `Tile ${tileX},${tileY} • Pixel ${pixelX},${pixelY}`;
}

/**
 * Format pixel count
 */
function formatPixelCount(template) {
  const total = template.pixelCount || 0;
  const valid = template.validPixelCount || total;
  const transparent = template.transparentPixelCount || 0;

  if (valid !== total && transparent > 0) {
    return `${new Intl.NumberFormat().format(total)} pixels (${new Intl.NumberFormat().format(valid)} valid)`;
  }
  return `${new Intl.NumberFormat().format(total)} pixels`;
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Manage Templates"
    @update:model-value="$emit('update:modelValue', $event)">
    <!-- Template List -->
    <div class="template-list">
      <div
        v-if="templateStore.templates.length === 0"
        class="empty-state">
        <p>No templates yet</p>
        <p class="hint">Create your first template using the Upload button</p>
      </div>

      <div
        v-for="template in templateStore.templates"
        :key="template.id"
        class="template-item">
        <!-- Template Info -->
        <div class="template-info">
          <!-- Name Row with Rename -->
          <div class="name-row">
            <button
              class="btn-rename"
              :title="`Rename ${template.displayName}`"
              @click="startRename(template)">
              <span v-html="icons.pencilIcon"></span>
            </button>

            <div
              v-if="editingTemplateId !== template.id"
              class="template-name"
              @click="startRename(template)">
              {{ template.displayName }}
            </div>

            <input
              v-else
              v-model="editingTemplateName"
              type="text"
              class="template-name-input"
              @keydown="handleRenameKeydown($event, template)"
              @blur="finishRename(template, true)"
              @click.stop>
          </div>

          <!-- Pixel Count -->
          <div class="template-pixels">
            {{ formatPixelCount(template) }}
          </div>

          <!-- Coordinates -->
          <div class="template-coords">
            📍 {{ formatCoords(template.coords) }}
          </div>
        </div>

        <!-- Template Actions -->
        <div class="template-actions">
          <!-- Export Button -->
          <button
            class="btn-action btn-export"
            title="Export this template as JSON"
            @click="handleExportTemplate(template)">
            <span v-html="icons.exportIcon"></span>
          </button>

          <!-- Fly To Button -->
          <button
            class="btn-action btn-fly"
            title="Fly to template coordinates"
            @click="flyToTemplate(template)">
            <span v-html="icons.pinIcon"></span>
          </button>

          <!-- Delete Button -->
          <button
            class="btn-action btn-delete"
            title="Delete this template"
            @click="deleteTemplate(template)">
            <span v-html="icons.deleteIcon"></span>
          </button>

          <!-- Toggle Button -->
          <button
            class="btn-toggle"
            :class="{ enabled: template.enabled }"
            @click="toggleTemplate(template)">
            {{ template.enabled ? 'Enabled' : 'Disabled' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <button
        class="btn-footer btn-enable-all"
        :disabled="templateStore.templates.length === 0"
        @click="enableAllTemplates">
        Enable All
      </button>
      <button
        class="btn-footer btn-disable-all"
        :disabled="templateStore.templates.length === 0"
        @click="disableAllTemplates">
        Disable All
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Template List */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .hint {
  font-size: 0.85em;
  color: #64748b;
}

/* Template Item */
.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #334155;
  border-radius: 12px;
  border: 1px solid #475569;
  gap: 16px;
}

/* Template Info */
.template-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.btn-rename {
  padding: 6px;
  border: 1px solid #475569;
  border-radius: 8px;
  cursor: pointer;
  background: #1f2937;
  color: #e2e8f0;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-rename:hover {
  background: #374151;
}

.btn-rename span :deep(svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.template-name {
  font-weight: 600;
  font-size: 1em;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
}

.template-name:hover {
  background: rgba(255, 255, 255, 0.05);
}

.template-name-input {
  width: 100%;
  font-weight: 600;
  font-size: 1em;
  color: #f1f5f9;
  border: 1px solid #475569;
  background: #1f2937;
  border-radius: 6px;
  padding: 6px 10px;
  outline: none;
  font-family: inherit;
}

.template-name-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.template-pixels {
  font-size: 0.85em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.template-coords {
  font-size: 0.75em;
  color: #60a5fa;
  font-weight: 500;
}

/* Template Actions */
.template-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.btn-action {
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
}

.btn-action:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.btn-action span :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
}

.btn-export {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.btn-fly {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.btn-toggle {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  min-width: 80px;
  background: linear-gradient(135deg, #64748b, #475569);
  color: #e2e8f0;
  transition: all 0.2s;
}

.btn-toggle.enabled {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-toggle:hover {
  filter: brightness(1.1);
}

/* Footer Buttons */
.btn-footer {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.2s;
}

.btn-footer:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-enable-all {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-enable-all:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-disable-all {
  background: linear-gradient(135deg, #64748b, #475569);
  color: #e2e8f0;
}

.btn-disable-all:hover:not(:disabled) {
  filter: brightness(1.1);
}

/* Scrollbar */
.template-list::-webkit-scrollbar {
  width: 8px;
}

.template-list::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 4px;
}

.template-list::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.template-list::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
