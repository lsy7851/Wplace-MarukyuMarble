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
  variant: {
    type: String,
    default: 'primary',
  },
  active: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'button',
  },
});

defineEmits(['click']);

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'flex items-center justify-center gap-1 py-0.5 px-2 bg-mm-blue-btn rounded border-none cursor-pointer font-inherit text-inherit text-[inherit] transition-colors duration-250 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 hover:bg-mm-blue-btn-hover active:bg-mm-blue-btn-active';

    case 'secondary':
      return 'px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border-none font-inherit bg-linear-to-br from-mm-bg-muted to-mm-bg-border text-mm-text-primary hover:not-disabled:from-mm-bg-light hover:not-disabled:to-mm-bg-muted hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(71,85,105,0.3)] active:not-disabled:translate-y-0';

    case 'success':
      return 'px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border-none font-inherit bg-linear-to-br from-mm-blue to-mm-blue-dark text-white hover:not-disabled:from-mm-blue-dark hover:not-disabled:to-mm-blue-darker hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(59,130,246,0.4)] active:not-disabled:translate-y-0';

    case 'toggle':
      return [
        'flex-1 px-3 py-2 border-none rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 ease-in-out font-inherit',
        props.active
          ? 'bg-linear-to-br from-mm-blue to-mm-blue-dark text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
          : 'bg-transparent text-mm-text-secondary hover:bg-mm-bg-dark hover:text-mm-text-muted',
      ];

    case 'action-success':
      return 'p-2 border-none rounded-lg cursor-pointer min-w-9 h-9 flex items-center justify-center text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 bg-linear-to-br from-[#22c55e] to-[#16a34a]';

    case 'action-blue':
      return 'p-2 border-none rounded-lg cursor-pointer min-w-9 h-9 flex items-center justify-center text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 bg-linear-to-br from-mm-blue to-mm-blue-dark';

    case 'action-danger':
      return 'p-2 border-none rounded-lg cursor-pointer min-w-9 h-9 flex items-center justify-center text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 bg-linear-to-br from-mm-error to-mm-error-dark';

    case 'bulk-enable':
      return 'px-4 py-2.5 border-none rounded-lg cursor-pointer font-semibold text-[0.9em] transition-all duration-200 bg-linear-to-br from-mm-success to-mm-success-dark text-white hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-px';

    case 'bulk-disable':
      return 'px-4 py-2.5 border-none rounded-lg cursor-pointer font-semibold text-[0.9em] transition-all duration-200 bg-linear-to-br from-mm-bg-light to-mm-bg-muted text-mm-text-dim hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-px';

    case 'bulk-danger':
      return 'px-4 py-2.5 border-none rounded-lg cursor-pointer font-semibold text-[0.9em] transition-all duration-200 bg-mm-red text-white hover:not-disabled:bg-[#da190b] hover:not-disabled:-translate-y-px';

    default:
      return '';
  }
});
</script>

<template>
  <button
    :type="type"
    :title="title"
    :disabled="disabled"
    :class="[
      variantClasses,
      disabled && 'opacity-50 cursor-not-allowed',
    ]"
    @click="!disabled && $emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
button :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

button span {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}
</style>
