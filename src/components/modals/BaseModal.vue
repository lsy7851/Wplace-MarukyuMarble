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

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDraggable } from '@vueuse/core';

const props = defineProps({
  /**
   * Control modal visibility
   */
  modelValue: {
    type: Boolean,
    default: false,
  },
  /**
   * Modal title
   */
  title: {
    type: String,
    default: '',
  },
  /**
   * Show close button
   */
  showClose: {
    type: Boolean,
    default: true,
  },
  /**
   * Close on backdrop click
   */
  closeOnBackdrop: {
    type: Boolean,
    default: false,
  },
  /**
   * Close on ESC key
   */
  closeOnEsc: {
    type: Boolean,
    default: true,
  },
  /**
   * Mobile mode - compact modal layout
   */
  mobileMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([ 'update:modelValue', 'close' ]);

// Modal and drag handle refs
const modalRef = ref(null);
const dragHandleRef = ref(null);

// Calculate initial centered position
const initialPosition = computed(() => ({
  x: Math.max(100, (window.innerWidth - 480) / 2), // 480px is approximate modal width
  y: Math.max(100, (window.innerHeight - 400) / 2), // Approximate modal height
}));

// Draggable setup using VueUse
const { x, y, style: draggableStyle, isDragging } = useDraggable(modalRef, {
  initialValue: initialPosition.value,
  preventDefault: true,
  handle: dragHandleRef,
});

/**
 * Close modal
 */
function close() {
  emit('update:modelValue', false);
  emit('close');
}

/**
 * Handle ESC key
 */
function handleEscKey(event) {
  if (props.closeOnEsc && event.key === 'Escape' && props.modelValue) {
    close();
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey);
});

// Reset position when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    x.value = initialPosition.value.x;
    y.value = initialPosition.value.y;
  }
});
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="modelValue"
      class="fixed top-0 left-0 w-full h-full z-2147483646 pointer-events-none flex items-center justify-center">
      <div
        ref="modalRef"
        :class="{
          'cursor-grabbing **:cursor-grabbing!': isDragging,
          'mobile-mode w-[min(350px,96vw)]! max-h-[70vh]! text-xs!': mobileMode
        }"
        :style="draggableStyle"
        class="fixed w-[min(480px,94vw)] bg-mm-bg-dark/92 text-mm-text-primary rounded-[14px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] border border-mm-bg-border backdrop-blur-[14px] font-[14px/1.5_Roboto_Mono,monospace,Arial] flex flex-col select-none overflow-hidden pointer-events-auto">
        <!-- Drag Handle -->
        <div
          ref="dragHandleRef"
          :class="{ 'cursor-grabbing!': isDragging }"
          class="drag-handle mb-[0.4em] bg-linear-to-br from-mm-bg-muted/60 to-mm-bg-light/55 cursor-grab w-full h-7 rounded-t-[14px] opacity-95 flex items-center justify-center"></div>

        <!-- Header -->
        <div
          :class="{ 'mobile-header': mobileMode }"
          class="flex items-center justify-between px-4 pt-3">
          <h3
            :class="{ 'mobile-title': mobileMode }"
            class="m-0 text-lg font-extrabold tracking-[0.04em] text-mm-text-bright">
            <slot name="title">{{ title }}</slot>
          </h3>
          <div class="flex gap-2 items-center">
            <slot name="actions"></slot>
            <button
              v-if="showClose"
              :class="{ 'mobile-close': mobileMode }"
              class="border border-mm-bg-muted px-2.5 py-2 rounded-lg bg-mm-bg-border text-mm-text-primary font-mono text-[13px] cursor-pointer transition-all duration-[0.18s] ease-in-out hover:bg-mm-bg-muted hover:-translate-y-px active:bg-mm-bg-border active:translate-y-0"
              @click="close">
              ✕
            </button>
          </div>
        </div>

        <!-- Body -->
        <div
          :class="{ 'mobile-body': mobileMode }"
          class="px-4 pt-3 pb-4 overflow-auto flex-1">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer" :class="{ 'mobile-footer': mobileMode }"
          class="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Drag handle pill indicator */
.drag-handle::before {
  content: '';
  width: 56px;
  height: 6px;
  border-radius: 6px;
  background: linear-gradient(90deg, #94a3b8, #cbd5e1);
  opacity: 0.7;
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ========================================
   Mobile Mode Styles
   ======================================== */

.mobile-mode .drag-handle {
  height: 24px;
}

.mobile-mode .drag-handle::before {
  width: 40px;
  height: 4px;
}

.mobile-header {
  padding: 8px 12px 0 12px;
}

.mobile-title {
  font-size: 15px;
}

.mobile-body {
  padding: 8px 12px 12px 12px;
  max-height: calc(70vh - 100px);
  overflow-y: auto;
}

.mobile-footer {
  padding: 8px 12px;
}

.mobile-close {
  padding: 6px 8px;
  font-size: 11px;
}
</style>
