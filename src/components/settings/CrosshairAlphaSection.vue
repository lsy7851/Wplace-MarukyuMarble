<template>
  <div class="rounded-xl border border-mm-bg-border bg-linear-to-br from-mm-bg-dark to-mm-bg-darkest p-4.5">
    <h3 class="m-0 mb-4 text-base font-semibold tracking-tight text-mm-text-muted">Crosshair Transparency</h3>

    <div class="flex flex-col gap-3">
      <input
        :value="alpha"
        type="range"
        min="50"
        max="255"
        class="alpha-slider"
        @input="updateAlpha" />

      <div class="mt-1 text-center text-lg font-bold tracking-tight text-mm-text-primary">{{ percentage }}%</div>
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
</style>
