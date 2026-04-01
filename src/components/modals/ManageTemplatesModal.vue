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
import { ref } from 'vue';
import { useTemplateStore } from '@/stores/templateStore';
import { useNavigation } from '@/composables/ui/useNavigation';
import { useCoordinateStore } from '@/stores/coordinateStore';
import { useImportExport } from '@/composables/features/useImportExport';
import BaseModal from './BaseModal.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import * as icons from '@@/old-src/icons.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([ 'update:modelValue' ]);

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
  const [ tileX, tileY, pixelX, pixelY ] = template.coords;

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
  const [ tileX, tileY, pixelX, pixelY ] = coords;
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
    <div class="template-list flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
      <div
        v-if="templateStore.templates.length === 0"
        class="text-center py-10 px-5 text-mm-text-secondary">
        <p class="my-2">No templates yet</p>
        <p class="my-2 text-[0.85em] text-mm-bg-light">Create your first template using the Upload button</p>
      </div>

      <div
        v-for="template in templateStore.templates"
        :key="template.id"
        class="flex justify-between items-center p-4 bg-mm-bg-border rounded-xl border border-mm-bg-muted gap-4">
        <!-- Template Info -->
        <div class="flex-1 min-w-0">
          <!-- Name Row with Rename -->
          <div class="flex items-center gap-2 mb-1.5">
            <button
              :title="`Rename ${template.displayName}`"
              class="btn-rename p-1.5 border border-mm-bg-muted rounded-lg cursor-pointer bg-[#1f2937] text-mm-text-dim min-w-8 h-8 flex items-center justify-center shrink-0 hover:bg-[#374151]"
              @click="startRename(template)">
              <span v-html="icons.pencilIcon"></span>
            </button>

            <div
              v-if="editingTemplateId !== template.id"
              class="font-semibold text-[1em] text-mm-text-primary overflow-hidden text-ellipsis whitespace-nowrap flex-1 px-1.5 py-1 rounded-md cursor-pointer hover:bg-white/5"
              @click="startRename(template)">
              {{ template.displayName }}
            </div>

            <input
              v-else
              v-model="editingTemplateName"
              class="w-full font-semibold text-[1em] text-mm-text-primary border border-mm-bg-muted bg-[#1f2937] rounded-md px-2.5 py-1.5 outline-none font-inherit focus:border-mm-blue focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
              type="text"
              @blur="finishRename(template, true)"
              @keydown="handleRenameKeydown($event, template)"
              @click.stop>
          </div>

          <!-- Pixel Count -->
          <div class="text-[0.85em] text-mm-text-secondary mb-1">
            {{ formatPixelCount(template) }}
          </div>

          <!-- Coordinates -->
          <div class="text-[0.75em] text-mm-blue-light font-medium">
            📍 {{ formatCoords(template.coords) }}
          </div>
        </div>

        <!-- Template Actions -->
        <div class="flex gap-2 items-center shrink-0">
          <!-- Export Button -->
          <BaseButton variant="action-success" title="Export this template as JSON" @click="handleExportTemplate(template)">
            <span v-html="icons.exportIcon"></span>
          </BaseButton>

          <!-- Fly To Button -->
          <BaseButton variant="action-blue" title="Fly to template coordinates" @click="flyToTemplate(template)">
            <span v-html="icons.pinIcon"></span>
          </BaseButton>

          <!-- Delete Button -->
          <BaseButton variant="action-danger" title="Delete this template" @click="deleteTemplate(template)">
            <span v-html="icons.deleteIcon"></span>
          </BaseButton>

          <!-- Toggle Button -->
          <BaseButton
            :variant="template.enabled ? 'bulk-enable' : 'bulk-disable'"
            class="min-w-20 text-[0.85em]"
            @click="toggleTemplate(template)">
            {{ template.enabled ? 'Enabled' : 'Disabled' }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <BaseButton
        variant="bulk-enable"
        :disabled="templateStore.templates.length === 0"
        @click="enableAllTemplates">
        Enable All
      </BaseButton>
      <BaseButton
        variant="bulk-disable"
        :disabled="templateStore.templates.length === 0"
        @click="disableAllTemplates">
        Disable All
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Deep SVG styling for rename button */
.btn-rename span :deep(svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

/* Deep SVG styling for action buttons */
.btn-action span :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
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
