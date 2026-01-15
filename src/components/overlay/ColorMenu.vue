<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useColorFilter } from '@/composables/useColorFilter.js';
import { useSettingsStore } from '@/stores/settingsStore.js';

// Props
const props = defineProps({
  minimized: Boolean,
});

const emit = defineEmits(['request-maximize']);

// Use color filter composable
const colorFilter = useColorFilter();

// Settings store
const settingsStore = useSettingsStore();

// Visibility from store
const showColorMenu = computed(() => settingsStore.showColorMenu);

// Mobile mode from store
const mobileMode = computed(() => settingsStore.mobileMode);

// Handle button click when minimized
function onMinimizedButtonClick() {
  emit('request-maximize');
}

// Resize state
const colorListRef = ref(null);
const isResizing = ref(false);
const startY = ref(0);
const startHeight = ref(0);

// Auto-update interval
let autoUpdateInterval = null;

// Helper to format numbers with locale
function formatNumber(num) {
  return num.toLocaleString();
}

// Resize handlers
function onResizeStart(event) {
  isResizing.value = true;
  startY.value = event.clientY || event.touches?.[0]?.clientY || 0;
  startHeight.value = colorListRef.value?.offsetHeight || settingsStore.colorMenuHeight;
  
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
  
  event.preventDefault();
  event.stopPropagation();
}

function onResizeMove(event) {
  if (!isResizing.value || !colorListRef.value) return;
  
  const clientY = event.clientY || event.touches?.[0]?.clientY || 0;
  const delta = clientY - startY.value;
  const newHeight = Math.max(60, Math.min(400, startHeight.value + delta));
  
  colorListRef.value.style.maxHeight = `${newHeight}px`;
  
  event.preventDefault();
  event.stopPropagation();
}

function onResizeEnd() {
  if (!isResizing.value) return;
  
  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // Save height to store
  if (colorListRef.value) {
    const currentHeight = colorListRef.value.offsetHeight;
    settingsStore.updateColorMenuHeight(currentHeight);
  }
}

// Toggle all visible colors
function toggleAllColors() {
  // Check if all filtered colors are disabled
  const allDisabled = colorFilter.filteredColors.value.every(c => c.isDisabled);
  
  if (allDisabled) {
    colorFilter.enableAllColors();
  } else {
    colorFilter.disableAllColors();
  }
}

// Handle color item click (toggle enabled/disabled)
function onColorClick(colorKey, event) {
  // Don't toggle if clicking on checkbox
  if (event.target.type === 'checkbox') return;
  colorFilter.toggleColorEnabled(colorKey);
}

// Handle enhanced checkbox change
function onEnhancedChange(colorKey) {
  colorFilter.toggleColorEnhanced(colorKey);
}

// Apply saved height from store
function applySavedHeight() {
  if (colorListRef.value && settingsStore.colorMenuHeight) {
    colorListRef.value.style.maxHeight = `${settingsStore.colorMenuHeight}px`;
  }
}

// Start auto-update for statistics
function startAutoUpdate() {
  if (autoUpdateInterval) clearInterval(autoUpdateInterval);
  
  // Trigger reactivity update every 5 seconds
  // Note: pixelStats in useColorFilter is already computed and reactive
  // This interval is kept for legacy compatibility
  autoUpdateInterval = setInterval(() => {
    // Force a slight state change to trigger any stale watchers
    // The computed properties should handle this automatically
  }, 5000);
}

onMounted(() => {
  applySavedHeight();
  startAutoUpdate();
  
  // Add document-level event listeners for resize
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
  document.addEventListener('touchmove', onResizeMove, { passive: false });
  document.addEventListener('touchend', onResizeEnd);
});

onUnmounted(() => {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }
  
  // Remove document-level event listeners
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
  document.removeEventListener('touchmove', onResizeMove);
  document.removeEventListener('touchend', onResizeEnd);
});
</script>

<template>
  <!-- Minimized state: show only icon button -->
  <button
    v-if="minimized && showColorMenu"
    id="bm-color-filter-btn-minimized"
    class="minimized-color-btn"
    title="Color Filter"
    @click="onMinimizedButtonClick">
    🎨
  </button>

  <!-- Normal state: show full menu -->
  <div v-if="!minimized && showColorMenu" id="bm-color-menu" :class="{ 'mobile-mode': mobileMode }">
    <!-- Toolbar: Search, Sort, Toggle All -->
    <div class="toolbar">
      <div>
        <input
          v-model="colorFilter.searchQuery.value"
          id="bm-color-search"
          autocomplete="off"
          placeholder="🔍 Search colors..."
          class="search-input"
          type="text"
          @keydown.stop
          @keyup.stop
          @keypress.stop />
      </div>
      <div>
        <select
          v-model="colorFilter.sortMode.value"
          id="bm-color-sort"
          class="sort-select">
          <option value="default">Default</option>
          <option value="premium">Premium 💧</option>
          <option value="wrong-desc">Most Wrong</option>
          <option value="missing-desc">Most Missing</option>
          <option value="missing-asc">Less Missing</option>
          <option value="painted-desc">Most Painted</option>
          <option value="painted-asc">Less Painted</option>
          <option value="enhanced">Enhanced Only</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>
      <div>
        <button
          id="bm-color-toggle-all"
          class="toggle-all-btn"
          title="Enable/Disable All Colors"
          @click="toggleAllColors">
          ⚡
        </button>
      </div>
    </div>

    <!-- Color List -->
    <div id="bm-color-list" ref="colorListRef">
      <div
        v-for="color in colorFilter.filteredColors.value"
        :key="color.colorKey"
        class="bm-color-item"
        :class="{ disabled: color.isDisabled }"
        @click="onColorClick(color.colorKey, $event)">
        
        <!-- Enhanced checkbox -->
        <input
          type="checkbox"
          class="enhanced-checkbox"
          :checked="color.isEnhanced"
          title="Enhanced mode (priority rendering)"
          @change.stop="onEnhancedChange(color.colorKey)" />
        
        <!-- Color swatch -->
        <div
          class="color-swatch"
          :style="{ background: `rgb(${color.colorInfo.rgb.join(',')})` }">
        </div>
        
        <!-- Color info -->
        <div class="color-info">
          <span class="color-name">{{ color.colorInfo.name }}</span>
          <span class="color-stats">
            {{ formatNumber(color.stats.painted) }} / {{ formatNumber(color.stats.totalRequired) }}
          </span>
          <span class="color-percentage">({{ color.stats.percentage }}%)</span>
          <span class="color-remaining">{{ formatNumber(color.stats.needsCrosshair) }}</span>
          <span v-if="!color.colorInfo.free" class="premium-badge">💧</span>
        </div>
      </div>
      
      <!-- No colors message -->
      <p v-if="colorFilter.filteredColors.value.length === 0" class="no-colors">
        {{ colorFilter.searchQuery.value ? 'No colors match your search' : 'No template colors available' }}
      </p>
    </div>

    <!-- Resize Handle -->
    <div
      id="bm-color-menu-resize-handle"
      @mousedown="onResizeStart"
      @touchstart.prevent="onResizeStart">
      <div class="resize-grip"></div>
    </div>
  </div>
</template>

<style scoped>
/* Minimized state button */
.minimized-color-btn {
  width: 56px;
  height: 38px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 4px auto 0;
}

.minimized-color-btn:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  transform: scale(1.05);
}

#bm-color-menu {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.search-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  min-width: 0;
  max-width: 120px;
}

.sort-select {
  padding: 4px 6px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  flex: 1;
  min-width: 80px;
}

.sort-select option {
  background: #2a2a2a;
  color: white;
}

.toggle-all-btn {
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  white-space: nowrap;
}

.toggle-all-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

#bm-color-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.bm-color-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  font-size: 11px;
  line-height: 1.3;
  min-height: 28px;
  transition: all 0.2s;
  cursor: pointer;
}

.bm-color-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.bm-color-item.disabled {
  opacity: 0.5;
}

.enhanced-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: gold;
  flex-shrink: 0;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.color-info {
  flex: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.color-name {
  color: white;
  font-weight: 500;
}

.color-stats {
  color: #888;
}

.color-percentage {
  color: #888;
}

.color-remaining {
  color: #ff8c42;
  font-weight: bold;
}

.premium-badge {
  font-size: 10px;
  opacity: 0.7;
  margin-left: auto;
}

.no-colors {
  margin: 8px 0;
  color: #888;
  text-align: center;
  font-size: 10px;
}

#bm-color-menu-resize-handle {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: ns-resize;
  border-radius: 0 0 6px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  margin-top: 4px;
}

#bm-color-menu-resize-handle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.resize-grip {
  width: 30px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

/* ========================================
   Mobile Mode Styles
   ======================================== */

/* Mobile mode container */
#bm-color-menu.mobile-mode {
  padding: 8px;
  border-radius: 6px;
}

/* Mobile toolbar */
#bm-color-menu.mobile-mode .toolbar {
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

#bm-color-menu.mobile-mode .search-input {
  padding: 6px 8px;
  font-size: 10px;
  max-width: 100px;
  min-height: 32px;
}

#bm-color-menu.mobile-mode .sort-select {
  padding: 6px 4px;
  font-size: 10px;
  min-width: 70px;
  min-height: 32px;
}

#bm-color-menu.mobile-mode .toggle-all-btn {
  padding: 6px 10px;
  font-size: 10px;
  min-height: 32px;
}

/* Mobile color list */
#bm-color-menu.mobile-mode #bm-color-list {
  gap: 2px;
  max-height: 120px;
}

/* Mobile color items - more compact */
#bm-color-menu.mobile-mode .bm-color-item {
  padding: 4px 6px;
  gap: 4px;
  font-size: 10px;
  min-height: 24px;
  border-radius: 3px;
}

#bm-color-menu.mobile-mode .enhanced-checkbox {
  width: 14px;
  height: 14px;
}

#bm-color-menu.mobile-mode .color-swatch {
  width: 14px;
  height: 14px;
}

#bm-color-menu.mobile-mode .color-info {
  gap: 3px;
}

#bm-color-menu.mobile-mode .color-name {
  font-size: 10px;
}

#bm-color-menu.mobile-mode .color-stats,
#bm-color-menu.mobile-mode .color-percentage {
  font-size: 9px;
}

#bm-color-menu.mobile-mode .color-remaining {
  font-size: 9px;
}

#bm-color-menu.mobile-mode .premium-badge {
  font-size: 8px;
}

/* Mobile resize handle */
#bm-color-menu.mobile-mode #bm-color-menu-resize-handle {
  height: 12px;
  margin-top: 2px;
}

#bm-color-menu.mobile-mode .resize-grip {
  width: 40px;
  height: 4px;
}

/* Mobile no colors message */
#bm-color-menu.mobile-mode .no-colors {
  font-size: 9px;
  margin: 4px 0;
}
</style>