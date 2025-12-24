<script setup>

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
  <div id="bm-title-container">
    <p class="icon" @click="toggleMinimized">⑨</p>
    <h1>Marukyu Marble</h1>
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
  }
}

</style>