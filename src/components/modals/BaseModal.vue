<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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

const emit = defineEmits(['update:modelValue', 'close']);

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
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal-backdrop">
        <div
          ref="modalRef"
          class="base-modal"
          :class="{ dragging: isDragging, 'mobile-mode': mobileMode }"
          :style="draggableStyle">
          <!-- Drag Handle -->
          <div
            ref="dragHandleRef"
            class="drag-handle"></div>

          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">
              <slot name="title">{{ title }}</slot>
            </h3>
            <div class="modal-actions">
              <slot name="actions"></slot>
              <button
                v-if="showClose"
                class="btn-close"
                @click="close">
                ✕
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2147483646;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal */
.base-modal {
  position: fixed;
  width: min(480px, 94vw);
  background: rgba(30, 41, 59, 0.92);
  color: #f1f5f9;
  border-radius: 14px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid #334155;
  backdrop-filter: blur(14px);
  font: 14px/1.5 Roboto Mono, monospace, Arial;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
  pointer-events: auto;
}

/* Dragging state */
.base-modal.dragging {
  cursor: grabbing;
}

.base-modal.dragging * {
  cursor: grabbing !important;
}

/* Drag Handle */
.drag-handle {
  margin-bottom: 0.4em;
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.6), rgba(100, 116, 139, 0.55));
  cursor: grab;
  width: 100%;
  height: 28px;
  border-radius: 14px 14px 0 0;
  opacity: 0.95;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle::before {
  content: '';
  width: 56px;
  height: 6px;
  border-radius: 6px;
  background: linear-gradient(90deg, #94a3b8, #cbd5e1);
  opacity: 0.7;
}

.dragging .drag-handle {
  cursor: grabbing;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 0 16px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f8fafc;
}

.modal-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-close {
  border: 1px solid #475569;
  padding: 8px 10px;
  border-radius: 8px;
  background: #334155;
  color: #f1f5f9;
  font: 13px monospace;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-close:hover {
  background: #475569;
  transform: translateY(-1px);
}

.btn-close:active {
  background: #334155;
  transform: translateY(0px);
}

/* Body */
.modal-body {
  padding: 12px 16px 16px 16px;
  overflow: auto;
  flex: 1;
}

/* Footer */
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

.base-modal.mobile-mode {
  width: min(350px, 96vw);
  max-height: 70vh;
  font-size: 12px;
}

.base-modal.mobile-mode .drag-handle {
  height: 24px;
}

.base-modal.mobile-mode .drag-handle::before {
  width: 40px;
  height: 4px;
}

.base-modal.mobile-mode .modal-header {
  padding: 8px 12px 0 12px;
}

.base-modal.mobile-mode .modal-title {
  font-size: 15px;
}

.base-modal.mobile-mode .modal-body {
  padding: 8px 12px 12px 12px;
  max-height: calc(70vh - 100px);
  overflow-y: auto;
}

.base-modal.mobile-mode .modal-footer {
  padding: 8px 12px;
}

.base-modal.mobile-mode .btn-close {
  padding: 6px 8px;
  font-size: 11px;
}
</style>
