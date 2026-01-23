<template>
    <div class="color-grid">
      <!-- Predefined color buttons -->
      <button
        v-for="color in predefinedColors"
        :key="color.name"
        class="color-button"
        :class="{ selected: isColorSelected(color) }"
        :style="{ background: getColorBackground(color) }"
        @click="selectColor(color)">
        <div class="color-name">{{ color.name }}</div>
        <div class="color-rgb">RGB({{ color.rgb.join(', ') }})</div>
        <div v-if="isColorSelected(color)" class="checkmark">✓</div>
      </button>

      <!-- Custom color button with RGB inputs -->
      <div
        class="color-button custom-color"
        :class="{ selected: isCustomSelected }"
        :style="{ background: customBackground }">
        <div class="color-name">Custom</div>
        <div class="rgb-inputs">
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
        <div v-if="isCustomSelected" class="checkmark">✓</div>
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

/* Color Grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

/* Color Button */
.color-button {
  position: relative;
  height: 90px;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: inherit;
}

.color-button:hover {
  border-color: rgba(255, 255, 255, 0.7);
  transform: scale(1.05);
}

.color-button.selected {
  border-color: #f1f5f9;
  box-shadow: 0 0 0 2px #3b82f6;
}

.color-name {
  font-size: 13px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
}

.color-rgb {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.checkmark {
  position: absolute;
  top: 5px;
  right: 5px;
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

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
.rgb-inputs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 70%;
}

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

/* Mobile responsiveness */
@media (max-width: 500px) {
  .color-grid {
    gap: 8px;
  }

  .color-button {
    height: 75px;
    padding: 8px;
  }

  .color-name {
    font-size: 12px;
  }

  .color-rgb {
    font-size: 10px;
  }
}
</style>
