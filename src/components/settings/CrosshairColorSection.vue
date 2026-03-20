<template>
    <div class="mb-4 grid grid-cols-3 gap-3 max-[500px]:gap-2">
      <!-- Predefined color buttons -->
      <button
        v-for="color in predefinedColors"
        :key="color.name"
        class="color-button relative flex h-22.5 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-white/30 p-2.5 font-[inherit] shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-white/70 max-[500px]:h-18.75 max-[500px]:p-2"
        :class="{ 'border-mm-text-primary shadow-[0_0_0_2px_#3b82f6]': isColorSelected(color) }"
        :style="{ background: getColorBackground(color) }"
        @click="selectColor(color)">
        <div class="text-center text-[13px] font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)] max-[500px]:text-xs">{{ color.name }}</div>
        <div class="text-[11px] text-white/80 [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)] max-[500px]:text-[10px]">RGB({{ color.rgb.join(', ') }})</div>
        <div v-if="isColorSelected(color)" class="absolute right-1.25 top-1.25 text-lg font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">✓</div>
      </button>

      <!-- Custom color button with RGB inputs -->
      <div
        class="custom-color relative flex h-22.5 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-white/30 p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-white/70 max-[500px]:h-18.75 max-[500px]:p-2"
        :class="{ 'selected border-mm-text-primary shadow-[0_0_0_2px_#3b82f6]': isCustomSelected }"
        :style="{ background: customBackground }">
        <div class="text-center text-[13px] font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)] max-[500px]:text-xs">Custom</div>
        <div class="flex w-[70%] flex-col gap-0.5">
          <input
            v-model.number="customRgb.r"
            type="number"
            min="0"
            max="255"
            placeholder="R"
            class="rgb-input"
            @click.stop
            @input="updateCustomColor" />
          <input
            v-model.number="customRgb.g"
            type="number"
            min="0"
            max="255"
            placeholder="G"
            class="rgb-input"
            @click.stop
            @input="updateCustomColor" />
          <input
            v-model.number="customRgb.b"
            type="number"
            min="0"
            max="255"
            placeholder="B"
            class="rgb-input"
            @click.stop
            @input="updateCustomColor" />
        </div>
        <div v-if="isCustomSelected" class="absolute right-1.25 top-1.25 text-lg font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">✓</div>
      </div>
    </div>
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
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

// Predefined colors
const predefinedColors = [
  { name: 'Red', rgb: [255, 0, 0], alpha: 255 },
  { name: 'Blue', rgb: [64, 147, 228], alpha: 255 },
  { name: 'Green', rgb: [0, 255, 0], alpha: 255 },
  { name: 'Purple', rgb: [170, 56, 185], alpha: 255 },
  { name: 'Yellow', rgb: [249, 221, 59], alpha: 255 },
  { name: 'Orange', rgb: [255, 127, 39], alpha: 255 },
  { name: 'Cyan', rgb: [96, 247, 242], alpha: 255 },
  { name: 'Pink', rgb: [236, 31, 128], alpha: 255 },
];

// Custom RGB values
const customRgb = ref({
  r: props.modelValue.isCustom ? props.modelValue.rgb[0] : 255,
  g: props.modelValue.isCustom ? props.modelValue.rgb[1] : 255,
  b: props.modelValue.isCustom ? props.modelValue.rgb[2] : 255,
});

// Check if a color is selected
function isColorSelected(color) {
  return (
    JSON.stringify(color.rgb) === JSON.stringify(props.modelValue.rgb) &&
    !props.modelValue.isCustom
  );
}

// Check if custom is selected
const isCustomSelected = computed(() => {
  return props.modelValue.isCustom || !predefinedColors.some(
    (c) => JSON.stringify(c.rgb) === JSON.stringify(props.modelValue.rgb)
  );
});

// Get color background for button
function getColorBackground(color) {
  const { rgb, alpha } = color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha / 255})`;
}

// Custom background (gradient or solid color)
const customBackground = computed(() => {
  if (isCustomSelected.value && props.modelValue.isCustom) {
    const { rgb } = props.modelValue;
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
  }
  // Animated gradient when not selected
  return 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #3B82F6 50%, #06B6D4 75%, #8B5CF6 100%)';
});

// Select a predefined color
function selectColor(color) {
  emit('update:modelValue', {
    ...color,
    isCustom: false,
    alpha: props.modelValue.alpha, // Preserve current alpha
  });
}

// Update custom color
function updateCustomColor() {
  const r = Math.max(0, Math.min(255, parseInt(customRgb.value.r) || 0));
  const g = Math.max(0, Math.min(255, parseInt(customRgb.value.g) || 0));
  const b = Math.max(0, Math.min(255, parseInt(customRgb.value.b) || 0));

  customRgb.value = { r, g, b };

  emit('update:modelValue', {
    name: `Custom RGB(${r}, ${g}, ${b})`,
    rgb: [r, g, b],
    alpha: props.modelValue.alpha,
    isCustom: true,
  });
}

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal.isCustom) {
      customRgb.value = {
        r: newVal.rgb[0],
        g: newVal.rgb[1],
        b: newVal.rgb[2],
      };
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* Custom Color */
.custom-color {
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

.custom-color.selected {
  animation: none;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* RGB Inputs */
.rgb-input {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid #64748b;
  border-radius: 4px;
  background: #334155;
  color: #f1f5f9;
  font-size: 11px;
  text-align: center;
  outline: none;
  font-weight: 600;
  transition: all 0.2s ease;
  box-sizing: border-box;
  height: 18px;
  font-family: inherit;
}

.rgb-input::placeholder {
  text-align: center;
  color: #64748b;
  font-weight: 600;
  opacity: 1;
}

.rgb-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
</style>
