<template>
  <BaseModal
    v-model="isOpen"
    title="Settings"
    :close-on-backdrop="false"
    :close-on-esc="true"
    @close="handleCancel">
    <!-- Scrollable Content -->
    <div class="settings-content">
      <!-- Instructions -->
      <p class="instructions">
        Select the crosshair color that appears on highlighted template pixels:
      </p>

      <!-- Current Color Preview -->
      <div class="current-color-preview">
        <div class="preview-label">Current Color:</div>
        <div class="preview-color-box">
          <CrosshairPreview
            :color="tempSettings.crosshairColor"
            :border="tempSettings.crosshairBorder"
            :enhanced-size="tempSettings.crosshairEnhancedSize" />
        </div>
      </div>

      <!-- Crosshair Color Selection -->
      <CrosshairColorSection v-model="tempSettings.crosshairColor" />

      <!-- Crosshair Alpha -->
      <CrosshairAlphaSection v-model="tempSettings.crosshairColor" />

      <!-- Border Options -->
      <div class="settings-section">
        <div class="section-label">Corner Borders:</div>
        <div class="section-description">
          Add subtle borders around corner pixels of the crosshair
        </div>
        <label class="toggle-container">
          <input
            v-model="tempSettings.crosshairBorder"
            type="checkbox" />
          <span class="toggle-text">{{ tempSettings.crosshairBorder ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <!-- Overlay Elements Visibility -->
      <div class="settings-section">
        <div class="section-label">Overlay Elements Visibility:</div>
        <div class="visibility-grid">
          <label
            v-for="item in visibilityItems"
            :key="item.key"
            class="visibility-checkbox">
            <input
              v-model="item.visible"
              type="checkbox"
              @change="updateVisibility(item.key, item.visible, item.elementId)" />
            <span>{{ item.label }}</span>
          </label>
        </div>
      </div>

      <!-- Crosshair Size -->
      <div class="settings-section">
        <div class="section-label">Crosshair Size:</div>
        <div class="section-description">
          Make crosshair 5x larger, extending beyond pixel boundaries
        </div>
        <label class="toggle-container">
          <input
            v-model="tempSettings.crosshairEnhancedSize"
            type="checkbox" />
          <span class="toggle-text">{{ tempSettings.crosshairEnhancedSize ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <!-- Crosshair Radius (conditional) -->
      <Transition name="slide-fade">
        <div v-if="tempSettings.crosshairEnhancedSize" class="settings-section radius-section">
          <div class="section-label">Crosshair Radius:</div>
          <div class="section-description">
            Control how far the crosshair extends from the center pixel
          </div>
          <div class="slider-container">
            <input
              v-model.number="tempSettings.crosshairRadius"
              type="range"
              min="12"
              max="512"
              class="slider" />
            <div class="slider-value">{{ tempSettings.crosshairRadius }}px</div>
          </div>
        </div>
      </Transition>

      <!-- Mini Progress Tracker -->
      <div class="settings-section">
        <div class="section-label">Mini Progress Tracker:</div>
        <div class="section-description">
          Show a compact progress tracker below the Color Filter button.
        </div>
        <label class="toggle-container">
          <input
            v-model="tempSettings.miniTrackerEnabled"
            type="checkbox" />
          <span class="toggle-text">{{ tempSettings.miniTrackerEnabled ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <!-- Mobile Mode -->
      <div class="settings-section">
        <div class="section-label">📱 Mobile Mode:</div>
        <div class="section-description">
          Enable ultra-compact UI for mobile devices. Makes Color Filter extremely compact for better mobile experience.
        </div>
        <label class="toggle-container">
          <input
            v-model="tempSettings.mobileMode"
            type="checkbox" />
          <span class="toggle-text">{{ tempSettings.mobileMode ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <!-- Collapse Mini Template -->
      <div class="settings-section">
        <div class="section-label">Collapse Mini Template:</div>
        <div class="section-description">
          Hide mini tracker when template section is collapsed.
        </div>
        <label class="toggle-container">
          <input
            v-model="tempSettings.collapseMinEnabled"
            type="checkbox" />
          <span class="toggle-text">{{ tempSettings.collapseMinEnabled ? 'Enabled' : 'Disabled' }}</span>
        </label>
      </div>

      <!-- Navigation Method -->
      <div class="settings-section">
        <h3 class="section-label">Navigation Method</h3>
        <p class="section-description">
          Choose how to navigate when clicking search results and favorites
        </p>
        <div class="button-group">
          <button
            class="mode-button"
            :class="{ active: tempSettings.navigationMethod === 'flyto' }"
            @click="tempSettings.navigationMethod = 'flyto'">
            FlyTo
          </button>
          <button
            class="mode-button"
            :class="{ active: tempSettings.navigationMethod === 'openurl' }"
            @click="tempSettings.navigationMethod = 'openurl'">
            OpenURL
          </button>
        </div>
      </div>

      <!-- Drag Mode -->
      <div class="settings-section">
        <div class="section-label">Drag Mode:</div>
        <p class="section-description">
          Choose how to drag the overlay: full overlay (easier on mobile) or drag bar only (classic mode).
        </p>
        <div class="button-group">
          <button
            class="mode-button"
            :class="{ active: tempSettings.dragMode }"
            @click="tempSettings.dragMode = true">
            Full Overlay
          </button>
          <button
            class="mode-button"
            :class="{ active: !tempSettings.dragMode }"
            @click="tempSettings.dragMode = false">
            Drag Bar Only
          </button>
        </div>
      </div>

      <!-- Smart Tile Cache -->
      <div class="settings-section">
        <h3 class="section-label">Tile Cache</h3>
        <p class="section-description">
          Cache processed tiles to reduce lag when revisiting areas. Automatically detects canvas changes.
        </p>
        <div class="button-group">
          <button
            class="mode-button"
            :class="{ active: !tempSettings.smartCacheEnabled }"
            @click="tempSettings.smartCacheEnabled = false">
            OFF
          </button>
          <button
            class="mode-button"
            :class="{ active: tempSettings.smartCacheEnabled }"
            @click="tempSettings.smartCacheEnabled = true">
            ON
          </button>
        </div>
      </div>
    </div>

    <!-- Footer with action buttons -->
    <template #footer>
      <div class="settings-footer">
        <button
          class="btn btn-secondary"
          @click="handleCancel">
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="!hasChanges"
          @click="handleApply">
          Apply Settings
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
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
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Store
const settingsStore = useSettingsStore();

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Temporary settings (not saved until Apply is clicked)
const tempSettings = ref({});

// Overlay Elements Visibility (stored in localStorage)
const visibilityItems = ref([
  { key: 'bmShowInformationHeader', label: 'Information Header', visible: true, elementId: null },
  { key: 'bmShowTemplateHeader', label: 'Template Header', visible: true, elementId: null },
  { key: 'bmShowUsername', label: 'Username', visible: true, elementId: 'bm-user-name' },
  { key: 'bmShowDroplets', label: 'Droplets', visible: true, elementId: 'bm-user-droplets' },
  { key: 'bmShowNextLevel', label: 'Next Level', visible: true, elementId: 'bm-user-nextlevel' },
  { key: 'bmShowFullCharge', label: 'Full Charge', visible: true, elementId: 'bm-user-fullcharge' },
  { key: 'bmShowColorMenu', label: 'Color Menu (Beta Test)', visible: true, elementId: 'bm-color-menu' },
]);

// Load visibility settings from localStorage
function loadVisibilitySettings() {
  visibilityItems.value.forEach(item => {
    try {
      const saved = localStorage.getItem(item.key);
      if (saved !== null) {
        item.visible = JSON.parse(saved);
      }
    } catch (e) {
      item.visible = true;
    }
  });
}

// Update visibility setting
function updateVisibility(key, visible, elementId) {
  try {
    localStorage.setItem(key, JSON.stringify(visible));

    if (elementId) {
      const el = document.getElementById(elementId);
      if (el) {
        el.style.display = visible ? '' : 'none';
      }
    } else {
      // For headers, we need to trigger a reload or emit an event
      // This will be handled by the parent component
    }
  } catch (e) {
    console.error('Failed to update visibility:', e);
  }
}

// Deep clone helper
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Load visibility settings on component mount
loadVisibilitySettings();

// Watch modal open/close to sync temp settings
watch(isOpen, (newVal) => {
  if (newVal) {
    // Modal opened - copy current settings to temp
    tempSettings.value = deepClone(settingsStore.getCurrentSettings());
  }
});

// Check if settings have changed
const hasChanges = computed(() => {
  if (!tempSettings.value || Object.keys(tempSettings.value).length === 0) {
    return false;
  }

  const current = settingsStore.getCurrentSettings();
  return JSON.stringify(tempSettings.value) !== JSON.stringify(current);
});

/**
 * Handle Cancel button
 */
function handleCancel() {
  if (hasChanges.value) {
    if (confirm('Discard changes? Any unsaved settings will be lost.')) {
      isOpen.value = false;
    }
  } else {
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
    console.log('✅ Settings applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply settings:', error);
    alert('Failed to apply settings. Please try again.');
  }
}
</script>

<style scoped>
/* Instructions */
.instructions {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  font-weight: 500;
  line-height: 1.4;
}

/* Current Color Preview */
.current-color-preview {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
}

.preview-label {
  font-size: 14px;
  margin-bottom: 12px;
  color: #cbd5e1;
  font-weight: 600;
}

.preview-color-box {
  display: flex;
  justify-content: center;
}

/* Settings Content */
.settings-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

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

/* Settings Section */
.settings-section {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.settings-section.radius-section {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 8px;
}

.section-label h3 {
  margin: 0;
  font-size: 14px;
}

.section-description {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
  line-height: 1.4;
}

/* Toggle Container */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-container input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.toggle-text {
  color: #cbd5e1;
  font-weight: 600;
  font-size: 13px;
}

/* Slider */
.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  background: linear-gradient(90deg, #475569, #64748b);
  cursor: pointer;
}

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

.slider-value {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  min-width: 50px;
  text-align: center;
  background: #334155;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #475569;
}

/* Button Group */
.button-group {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid #475569;
}

.mode-button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  background: transparent;
  color: #94a3b8;
  font-family: inherit;
}

.mode-button.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.mode-button:hover:not(.active) {
  background: #1e293b;
  color: #cbd5e1;
}

/* Visibility Grid */
.visibility-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.visibility-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.visibility-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.visibility-checkbox span {
  color: #94a3b8;
  font-size: 10px;
}

/* Settings Footer */
.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, #475569, #334155);
  color: #f1f5f9;
  border: 1px solid #64748b;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #64748b, #475569);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(71, 85, 105, 0.3);
}

.btn-secondary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: 1px solid #2563eb;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
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
