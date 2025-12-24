<script setup>

const props = defineProps({
  icons: String,
  headerText: String,
});

</script>

<template>
  <div id="bm-separator">
    <hr />
    <div id="bm-separator-text">
      <div v-html="props.icons"></div>
      <p>{{props.headerText}}</p>
    </div>
    <hr />
  </div>
</template>

<style scoped>
/* Separators */
#bm-separator {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: .5rem;
  margin-top: 3px;

  user-select: none;

  #bm-separator-text {
    display: flex;
    gap: .5rem;
    align-items: center;
  }
}

#bm-overlay hr {
  transition: opacity 0.2s ease, height 0.2s ease;
}

</style>