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
