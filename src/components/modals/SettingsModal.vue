<template>
  <BaseModal
    v-model="isOpen"
    :close-on-backdrop="false"
    :close-on-esc="true"
    :mobile-mode="mobileMode"
    title="Settings"
    @close="handleCancel">
    <!-- Scrollable Content -->
    <div class="settings-content max-h-[60vh] overflow-y-auto pr-1">
      <!-- Instructions -->
      <p class="m-0 mb-5 text-sm text-mm-text-secondary text-center font-medium leading-[1.4]">
        Select the crosshair color that appears on highlighted template pixels:
      </p>

      <!-- Current Color Preview -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-5 text-center">
        <div class="text-sm mb-3 text-mm-text-muted font-semibold">Current Color:</div>
        <div class="flex justify-center">
          <CrosshairPreview
            :border="tempSettings.crosshairBorder"
            :color="tempSettings.crosshairColor"
            :enhanced-size="tempSettings.crosshairEnhancedSize" />
        </div>
      </div>

      <!-- Crosshair Color Selection -->
      <CrosshairColorSection v-model="tempSettings.crosshairColor" />

      <!-- Crosshair Alpha -->
      <CrosshairAlphaSection v-model="tempSettings.crosshairColor" />

      <!-- Border Options -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">Corner Borders:</div>
        <div class="text-xs text-mm-text-secondary mb-3 leading-[1.4]">
          Add subtle borders around corner pixels of the crosshair
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="tempSettings.crosshairBorder"
            class="w-4 h-4 cursor-pointer accent-mm-blue"
            type="checkbox" />
          <span class="text-mm-text-muted font-semibold text-[13px]">{{
              tempSettings.crosshairBorder ? 'Enabled' : 'Disabled'
            }}</span>
        </label>
      </div>

      <!-- Overlay Elements Visibility -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">Overlay Elements Visibility:</div>
        <div class="grid grid-cols-2 gap-2">
          <label
            v-for="item in visibilityItems"
            :key="item.key"
            class="flex items-center gap-2 cursor-pointer select-none">
            <input
              v-model="item.visible"
              class="w-4 h-4 cursor-pointer accent-mm-blue"
              type="checkbox"
              @change="updateVisibility(item.key, item.visible)" />
            <span class="text-mm-text-secondary text-[10px]">{{ item.label }}</span>
          </label>
        </div>
      </div>

      <!-- Crosshair Size -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">Crosshair Size:</div>
        <div class="text-xs text-mm-text-secondary mb-3 leading-[1.4]">
          Make crosshair 5x larger, extending beyond pixel boundaries
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="tempSettings.crosshairEnhancedSize"
            class="w-4 h-4 cursor-pointer accent-mm-blue"
            type="checkbox" />
          <span
            class="text-mm-text-muted font-semibold text-[13px]">{{
              tempSettings.crosshairEnhancedSize ? 'Enabled' : 'Disabled'
            }}</span>
        </label>
      </div>

      <!-- Crosshair Radius (conditional) -->
      <Transition name="slide-fade">
        <div v-if="tempSettings.crosshairEnhancedSize" class="bg-mm-blue/5 border border-mm-blue/20 rounded-xl p-4 mb-4">
          <div class="text-sm font-semibold text-mm-text-muted mb-2">Crosshair Radius:</div>
          <div class="text-xs text-mm-text-secondary mb-3 leading-[1.4]">
            Control how far the crosshair extends from the center pixel
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model.number="tempSettings.crosshairRadius"
              class="slider flex-1 h-1.5 rounded-sm outline-none appearance-none bg-linear-to-r from-mm-bg-muted to-mm-bg-light cursor-pointer"
              max="512"
              min="12"
              type="range" />
            <div
              class="text-sm font-semibold text-mm-text-primary min-w-12.5 text-center bg-mm-bg-border px-3 py-1.5 rounded-md border border-mm-bg-muted">
              {{ tempSettings.crosshairRadius }}px
            </div>
          </div>
        </div>
      </Transition>

      <!-- Mini Progress Tracker -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">Mini Progress Tracker:</div>
        <div class="text-xs text-mm-text-secondary mb-3 leading-[1.4]">
          Show a compact progress tracker below the Color Filter button.
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="tempSettings.miniTrackerEnabled"
            class="w-4 h-4 cursor-pointer accent-mm-blue"
            type="checkbox" />
          <span class="text-mm-text-muted font-semibold text-[13px]">{{
              tempSettings.miniTrackerEnabled ? 'Enabled' : 'Disabled'
            }}</span>
        </label>
      </div>

      <!-- Mobile Mode -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">📱 Mobile Mode:</div>
        <div class="text-xs text-mm-text-secondary mb-3 leading-[1.4]">
          Enable ultra-compact UI for mobile devices. Makes Color Filter extremely compact for better mobile experience.
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="tempSettings.mobileMode"
            class="w-4 h-4 cursor-pointer accent-mm-blue"
            type="checkbox" />
          <span class="text-mm-text-muted font-semibold text-[13px]">{{ tempSettings.mobileMode ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <!-- Collapse Mini Template -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">Collapse Mini Template:</div>
        <div class="text-xs text-mm-text-secondary mb-3 leading-[1.4]">
          Hide mini tracker when template section is collapsed.
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="tempSettings.collapseMinEnabled"
            class="w-4 h-4 cursor-pointer accent-mm-blue"
            type="checkbox" />
          <span class="text-mm-text-muted font-semibold text-[13px]">{{
              tempSettings.collapseMinEnabled ? 'Enabled' : 'Disabled'
            }}</span>
        </label>
      </div>

      <!-- Navigation Method -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-mm-text-muted mb-2 m-0">Navigation Method</h3>
        <p class="text-xs text-mm-text-secondary mb-3 leading-[1.4] m-0">
          Choose how to navigate when clicking search results and favorites
        </p>
        <div class="flex gap-2 p-1 bg-mm-bg-darkest rounded-lg border border-mm-bg-muted">
          <button
            :class="tempSettings.navigationMethod === 'flyto'
              ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted'"
            class="flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit"
            @click="tempSettings.navigationMethod = 'flyto'">
            FlyTo
          </button>
          <button
            :class="tempSettings.navigationMethod === 'openurl'
              ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted'"
            class="flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit"
            @click="tempSettings.navigationMethod = 'openurl'">
            OpenURL
          </button>
        </div>
      </div>

      <!-- Drag Mode -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-mm-text-muted mb-2">Drag Mode:</div>
        <p class="text-xs text-mm-text-secondary mb-3 leading-[1.4] m-0">
          Choose how to drag the overlay: full overlay (easier on mobile) or drag bar only (classic mode).
        </p>
        <div class="flex gap-2 p-1 bg-mm-bg-darkest rounded-lg border border-mm-bg-muted">
          <button
            :class="tempSettings.dragMode
              ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted'"
            class="flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit"
            @click="tempSettings.dragMode = true">
            Full Overlay
          </button>
          <button
            :class="!tempSettings.dragMode
              ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted'"
            class="flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit"
            @click="tempSettings.dragMode = false">
            Drag Bar Only
          </button>
        </div>
      </div>

      <!-- Smart Tile Cache -->
      <div class="bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest border border-mm-bg-border rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-mm-text-muted mb-2 m-0">Tile Cache</h3>
        <p class="text-xs text-mm-text-secondary mb-3 leading-[1.4] m-0">
          Cache processed tiles to reduce lag when revisiting areas. Automatically detects canvas changes.
        </p>
        <div class="flex gap-2 p-1 bg-mm-bg-darkest rounded-lg border border-mm-bg-muted">
          <button
            :class="!tempSettings.smartCacheEnabled
              ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted'"
            class="flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit"
            @click="tempSettings.smartCacheEnabled = false">
            OFF
          </button>
          <button
            :class="tempSettings.smartCacheEnabled
              ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted'"
            class="flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit"
            @click="tempSettings.smartCacheEnabled = true">
            ON
          </button>
        </div>
      </div>
    </div>

    <!-- Footer with action buttons -->
    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <button
          class="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border-none font-inherit bg-linear-to-br from-mm-bg-muted to-mm-bg-border text-mm-text-primary border border-mm-bg-light hover:not-disabled:bg-linear-to-br hover:not-disabled:from-mm-bg-light hover:not-disabled:to-mm-bg-muted hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(71,85,105,0.3)] active:not-disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleCancel">
          Cancel
        </button>
        <button
          :disabled="!hasChanges"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border-none font-inherit bg-linear-to-br from-mm-blue to-mm-blue-dark text-white border border-mm-blue-dark hover:not-disabled:bg-linear-to-br hover:not-disabled:from-mm-blue-dark hover:not-disabled:to-mm-blue-darker hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(59,130,246,0.4)] active:not-disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleApply">
          Apply Settings
        </button>
      </div>
    </template>
  </BaseModal>
</template>

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
import { computed, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import CrosshairPreview from '@/components/settings/CrosshairPreview.vue';
import CrosshairColorSection from '@/components/settings/CrosshairColorSection.vue';
import CrosshairAlphaSection from '@/components/settings/CrosshairAlphaSection.vue';
import { useSettingsStore } from '@/stores/settingsStore.js';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mobileMode: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([ 'update:modelValue' ]);

// Store
const settingsStore = useSettingsStore();

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Temporary settings (not saved until Apply is clicked)
const tempSettings = ref({});

// Original settings when modal opened (for change detection and Cancel restoration)
const originalSettings = ref({});

// Visibility keys that should be applied immediately
const visibilityKeys = [
  'showInformationHeader',
  'showTemplateHeader',
  'showUsername',
  'showDroplets',
  'showNextLevel',
  'showFullCharge',
  'showColorMenu',
];

// Visibility items configuration (now using store-based state via tempSettings)
const visibilityItemsConfig = [
  { storeKey: 'showInformationHeader', label: 'Information Header', elementId: null },
  { storeKey: 'showTemplateHeader', label: 'Template Header', elementId: null },
  { storeKey: 'showUsername', label: 'Username', elementId: 'bm-user-name' },
  { storeKey: 'showDroplets', label: 'Droplets', elementId: 'bm-user-droplets' },
  { storeKey: 'showNextLevel', label: 'Next Level', elementId: 'bm-user-nextlevel' },
  { storeKey: 'showFullCharge', label: 'Full Charge', elementId: 'bm-user-fullcharge' },
  { storeKey: 'showColorMenu', label: 'Color Menu (Beta Test)', elementId: 'bm-color-menu' },
];

// Computed visibility items that sync with tempSettings
const visibilityItems = computed(() =>
  visibilityItemsConfig.map(item => ({
    key: item.storeKey,
    label: item.label,
    elementId: item.elementId,
    get visible() {
      return tempSettings.value[item.storeKey] ?? true;
    },
    set visible(value) {
      tempSettings.value[item.storeKey] = value;
    },
  })),
);

// Update visibility setting (applies immediately for visual feedback)
function updateVisibility(key, visible) {
  tempSettings.value[key] = visible;

  // Apply immediately to store for instant visual feedback
  if (visibilityKeys.includes(key) && settingsStore[key] !== undefined) {
    settingsStore[key] = visible;
  }
}

// Deep clone helper
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Watch modal open/close to sync temp settings
watch(isOpen, (newVal) => {
  if (newVal) {
    // Modal opened - copy current settings to temp and save original for comparison
    const currentSettings = settingsStore.getCurrentSettings();
    tempSettings.value = deepClone(currentSettings);
    originalSettings.value = deepClone(currentSettings);
  }
});

// Check if settings have changed (compare with original, not current store)
const hasChanges = computed(() => {
  if (!tempSettings.value || Object.keys(tempSettings.value).length === 0) {
    return false;
  }

  return JSON.stringify(tempSettings.value) !== JSON.stringify(originalSettings.value);
});

/**
 * Restore original visibility settings (called on Cancel)
 */
function restoreVisibility() {
  for (const key of visibilityKeys) {
    if (originalSettings.value[key] !== undefined) {
      settingsStore[key] = originalSettings.value[key];
    }
  }
}

/**
 * Handle Cancel button
 */
function handleCancel() {
  if (hasChanges.value) {
    if (confirm('Discard changes? Any unsaved settings will be lost.')) {
      restoreVisibility();
      isOpen.value = false;
    }
  } else {
    restoreVisibility();
    isOpen.value = false;
  }
}

/**
 * Handle Apply button
 */
async function handleApply() {
  try {
    await settingsStore.applySettings(tempSettings.value);
    isOpen.value = false;
  } catch {
    alert('Failed to apply settings. Please try again.');
  }
}
</script>

<style scoped>
/* Custom scrollbar */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Slider thumb */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #f1f5f9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #f1f5f9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* Transition */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
