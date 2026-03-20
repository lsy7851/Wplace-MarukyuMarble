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
  <div id="bm-separator" class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-0.75 select-none">
    <hr />
    <div id="bm-separator-text" class="flex gap-2 items-center">
      <div v-html="props.icons"></div>
      <p>{{props.headerText}}</p>
    </div>
    <hr />
  </div>
</template>
