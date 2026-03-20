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
const clickBtn = () => {
  alert('⑨ Cirno Marble is working!');
};
</script>

<template>
  <div class="fixed top-2.5 right-2.5 bg-white/95 border-2 border-[#4a90e2] rounded-lg p-4 z-10000 font-[Arial,sans-serif] shadow-md">
    <h3 class="m-0 mb-3 text-[#2c3e50] text-base">⑨ Marukyu Marble</h3>
    <p>Template overlay tool</p>
    <button
      id="marukyu-test-btn"
      class="bg-[#4a90e2] text-white border-none px-4 py-2 rounded cursor-pointer text-sm hover:bg-[#357abd]"
      @click="clickBtn">Test Button</button>
  </div>
</template>
