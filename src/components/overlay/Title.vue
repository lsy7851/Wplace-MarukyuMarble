<script setup>
import { computed } from 'vue';

const props = defineProps({
  minimized: Boolean,
});

const emits = defineEmits([ 'update:minimized' ]);

const minimized = computed({
  get: () => props.minimized,
  set: (value) => {
    emits('update:minimized', value);
  },
});

const toggleMinimized = () => {
  minimized.value = !minimized.value;
};
</script>
<template>
  <div id="bm-title-container" :class="{ 'is-minimized': minimized }">
    <p class="icon" @click="toggleMinimized" :title="minimized ? 'Click to maximize' : 'Click to minimize'">⑨</p>
    <h1 v-show="!minimized">Marukyu Marble</h1>
  </div>
</template>

<style scoped>
/* The icon and title */
#bm-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;

  h1 {
    font-weight: 900;
    font-size: 1.5rem;
  }

  .icon {
    cursor: pointer;
    width: 42px;
    height: 42px;
    font-size: 42px;
    line-height: 42px;
    transition: transform 0.2s ease;
  }

  .icon:hover {
    transform: scale(1.1);
  }

  &.is-minimized {
    justify-content: center;
  }
}
</style>