<template>
  <div class="crosshair-preview">
    <div
      ref="previewRef"
      class="crosshair-box"
      :style="{ background: backgroundColor }">
      <!-- Crosshair pattern -->
      <div
        class="crosshair-pattern"
        :class="{ enhanced: enhancedSize }">
        <!-- Standard 3x3 pattern or Enhanced 5x5 pattern -->
        <template v-if="!enhancedSize">
          <!-- Row 1 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 2 -->
          <div :style="{ background: pixelColor }"></div>
          <div class="center-pixel"></div>
          <div :style="{ background: pixelColor }"></div>

          <!-- Row 3 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
        </template>

        <template v-else>
          <!-- Enhanced 5x5 pattern -->
          <!-- Row 1 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 2 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 3 (center row) -->
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div class="center-pixel"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: pixelColor }"></div>

          <!-- Row 4 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>

          <!-- Row 5 -->
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: pixelColor }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
          <div :style="{ background: borderEnabled ? borderColor : 'transparent' }"></div>
        </template>
      </div>
    </div>
    <div class="color-name">{{ color.name }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  color: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.rgb && Array.isArray(value.rgb) && value.rgb.length === 3 && typeof value.alpha === 'number';
    },
  },
  border: {
    type: Boolean,
    default: false,
  },
  enhancedSize: {
    type: Boolean,
    default: false,
  },
});

// Computed color values
const pixelColor = computed(() => {
  const { rgb, alpha } = props.color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha / 255})`;
});

const borderColor = computed(() => {
  return 'rgba(0, 100, 255, 0.8)'; // Blue borders
});

const backgroundColor = computed(() => {
  return '#475569'; // Slate-600
});
</script>

<style scoped>
.crosshair-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.color-name {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.025em;
}

.crosshair-box {
  width: 60px;
  height: 60px;
  border: 2px solid #64748b;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.crosshair-box:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}

/* Crosshair Pattern */
.crosshair-pattern {
  display: grid;
  gap: 1px;
  background: rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
}

.crosshair-pattern:not(.enhanced) {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.crosshair-pattern.enhanced {
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
}

.center-pixel {
  background: black;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-sizing: border-box;
}
</style>
