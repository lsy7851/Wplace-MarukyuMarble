<template>
  <div class="settings-section">
    <h3 class="section-title">Crosshair Transparency</h3>

    <div class="slider-container">
      <input
        :value="alpha"
        type="range"
        min="50"
        max="255"
        class="alpha-slider"
        @input="updateAlpha" />

      <div class="alpha-value">{{ percentage }}%</div>
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
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

// Get current alpha value
const alpha = computed(() => props.modelValue.alpha || 255);

// Calculate percentage
const percentage = computed(() => Math.round((alpha.value / 255) * 100));

// Update alpha value
function updateAlpha(event) {
  const newAlpha = parseInt(event.target.value);

  emit('update:modelValue', {
    ...props.modelValue,
    alpha: newAlpha,
  });
}
</script>

<style scoped>
.settings-section {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 18px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: -0.01em;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alpha-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, #475569, #94a3b8);
  cursor: pointer;
}

/* Webkit (Chrome, Safari) slider thumb */
.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #f1f5f9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.alpha-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  transform: scale(1.1);
}

/* Firefox slider thumb */
.alpha-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #f1f5f9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.alpha-slider::-moz-range-thumb:hover {
  background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  transform: scale(1.1);
}

.alpha-value {
  text-align: center;
  font-weight: 700;
  font-size: 18px;
  color: #f1f5f9;
  letter-spacing: -0.025em;
  margin-top: 4px;
}
</style>
