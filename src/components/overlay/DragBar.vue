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
defineProps({
  minimized: Boolean,
});
</script>
<template>
  <div
    id="bm-bar-drag"
    class="mb-[0.5em] bg-[linear-gradient(90deg,#475569_0%,#64748b_50%,#475569_100%)] rounded-sm cursor-grab w-full h-1.5 relative opacity-80 transition-[opacity,margin-bottom] duration-200 ease-in-out hover:opacity-100"
    :class="{ 'mb-[0.25em]': minimized }"></div>
</template>

<style scoped>
#bm-bar-drag.dragging {
  cursor: grabbing;
  pointer-events: auto;
}
</style>
