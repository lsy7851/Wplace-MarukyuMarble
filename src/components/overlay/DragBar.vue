<script setup>
defineProps({
  minimized: Boolean,
});
</script>
<template>
  <div id="bm-bar-drag" :class="{ 'is-minimized': minimized }"></div>
</template>

<style scoped>
/* The drag bar - always visible for dragging */
#bm-bar-drag {
  margin-bottom: 0.5em;
  background: linear-gradient(90deg, #475569 0%, #64748b 50%, #475569 100%);
  border-radius: 4px;
  cursor: grab;
  width: 100%;
  height: 6px;
  position: relative;
  opacity: 0.8;
  transition: opacity 0.2s ease, margin-bottom 0.2s ease;

  &:hover {
    opacity: 1;
  }

  &.dragging {
    cursor: grabbing;
    pointer-events: auto;
  }

  &.is-minimized {
    margin-bottom: 0.25em;
  }
}
</style>