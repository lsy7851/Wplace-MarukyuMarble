<script setup>
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Modified work Copyright (c) 2025 lsy7851 and Marukyu Marble Contributors
 */
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  checked: {
    type: Boolean,
    default: undefined,
  },
  label: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['xs', 'sm', 'md', 'lg'].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    default: undefined,
  },
  accentColor: {
    type: String,
    default: 'accent-mm-blue',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'size-3';
    case 'sm': return 'size-3.5';
    case 'lg': return 'w-4.5 h-4.5';
    default: return 'size-4';
  }
});

const isChecked = computed(() =>
  props.checked !== undefined ? props.checked : props.modelValue,
);

function handleChange(event) {
  const value = event.target.checked;
  emit('update:modelValue', value);
  emit('change', event);
}
</script>

<template>
  <label
    :for="id"
    :class="[
      'inline-flex items-center gap-2 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
    ]">
    <input
      :id="id"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      :class="[
        sizeClass,
        accentColor,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ]"
      @change="handleChange" />
    <span v-if="label || $slots.default">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
