<script setup>
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Modified work Copyright (c) 2025 lsy7851 and Marukyu Marble Contributors
 */
import { computed, ref } from 'vue';

const inputRef = ref(null);

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  el: inputRef,
});

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: undefined,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  min: {
    type: [String, Number],
    default: undefined,
  },
  max: {
    type: [String, Number],
    default: undefined,
  },
  step: {
    type: [String, Number],
    default: undefined,
  },
  required: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: v => ['default', 'compact', 'coordinate'].includes(v),
  },
  noValidationStyle: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'input', 'keydown', 'keyup', 'keypress', 'focus', 'blur']);

const baseClasses = 'w-full bg-mm-bg-darkest border border-mm-bg-muted text-mm-text-primary font-mono text-sm transition-all duration-200 ease-in-out focus:border-mm-blue focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] focus:outline-none placeholder:text-[#64748b]';

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'compact':
      return 'h-8 py-1.5 pl-2.5 pr-7 rounded-lg text-[0.85em]';
    case 'coordinate':
      return 'h-[2.2rem] px-2 rounded-lg text-[0.9rem] font-inherit appearance-auto';
    default:
      return 'px-3 py-2.5 rounded-lg';
  }
});

function handleInput(event) {
  emit('update:modelValue', event.target.value);
  emit('input', event);
}
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :required="required"
      :class="[
        baseClasses,
        variantClasses,
        readonly && 'cursor-not-allowed',
        noValidationStyle && 'no-validation',
      ]"
      @input="handleInput"
      @keydown="$emit('keydown', $event)"
      @keyup="$emit('keyup', $event)"
      @keypress="$emit('keypress', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)" />
    <slot name="suffix" />
  </div>
</template>

<style scoped>
/* Spinner removal for number inputs */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Validation suppression */
input.no-validation:invalid {
  border-color: var(--color-mm-bg-muted) !important;
  box-shadow: none !important;
  outline: none !important;
}
</style>
