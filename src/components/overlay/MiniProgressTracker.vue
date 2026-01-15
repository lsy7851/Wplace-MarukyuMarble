<template>
  <div
    v-if="shouldShow"
    id="bm-mini-tracker"
    class="mini-tracker">
    <div class="tracker-title">
      {{ progressTitle }}
    </div>
    <div class="tracker-pixels">
      {{ progressPixels }}
    </div>
    <div class="tracker-progress">
      <div
        class="tracker-bar"
        :style="{ width: `${progressPercentage}%` }">
      </div>
    </div>
    <div class="tracker-left">
      {{ progressLeft }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useTemplateStore } from '@/stores/templateStore.js';
import { useProgressTracking } from '@/composables/useProgressTracking.js';

// Props
const props = defineProps({
  minimized: {
    type: Boolean,
    default: false,
  },
});

// Stores
const settingsStore = useSettingsStore();
const templateStore = useTemplateStore();

// Progress tracking composable
const { aggregatedProgress, formatNumber } = useProgressTracking();

// Settings
const { miniTrackerEnabled, collapseMinEnabled } = storeToRefs(settingsStore);

/**
 * Should the tracker be shown?
 * - Hidden if disabled
 * - Hidden if collapse is enabled AND overlay is minimized
 */
const shouldShow = computed(() => {
  if (!miniTrackerEnabled.value) {
    return false;
  }

  if (collapseMinEnabled.value && props.minimized) {
    return false;
  }

  return true;
});

/**
 * Progress percentage (0-100)
 */
const progressPercentage = computed(() => {
  return aggregatedProgress.value.percentage || 0;
});

/**
 * Progress title text
 */
const progressTitle = computed(() => {
  return `📊 Template Progress: ${progressPercentage.value}%`;
});

/**
 * Progress pixels text
 */
const progressPixels = computed(() => {
  const { totalPainted, totalRequired } = aggregatedProgress.value;
  return `${formatNumber(totalPainted)} / ${formatNumber(totalRequired)} pixels painted`;
});

/**
 * Pixels left text
 */
const progressLeft = computed(() => {
  const { remaining } = aggregatedProgress.value;
  return `${formatNumber(remaining)} Pixels Left`;
});
</script>

<style scoped>
.mini-tracker {
  background: linear-gradient(135deg, #1e293b, #334155);
  border: 1px solid #475569;
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 8px;
  color: #f1f5f9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
  font-size: 0.85rem;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto;
  gap: 6px;
  letter-spacing: -0.01em;
  box-sizing: border-box;
  user-select: none;
  cursor: default;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.mini-tracker:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

.mini-tracker::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.mini-tracker:hover::before {
  opacity: 1;
}

.tracker-title {
  font-size: 1rem;
  font-weight: 700;
  width: 100%;
  text-align: left;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

.tracker-pixels {
  font-size: 0.8rem;
  color: #cbd5e1;
  width: 100%;
  text-align: left;
  font-weight: 500;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

.tracker-progress {
  height: 8px;
  background: #475569;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  border: 1px solid #64748b;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.tracker-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
  min-width: 0;
}

.tracker-left {
  font-size: 0.8rem;
  color: #fbbf24;
  width: 100%;
  text-align: left;
  font-weight: 600;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}
</style>
