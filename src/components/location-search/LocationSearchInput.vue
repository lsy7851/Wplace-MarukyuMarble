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
import { ref, watch } from 'vue';
import { useLocationSearchStore } from '@/stores/locationSearchStore.js';

const locationSearchStore = useLocationSearchStore();

const inputRef = ref(null);
const localQuery = ref('');

// Sync with store
watch(() => locationSearchStore.query, (newQuery) => {
  if (localQuery.value !== newQuery) {
    localQuery.value = newQuery;
  }
});

function handleInput() {
  locationSearchStore.debouncedSearch(localQuery.value);
}

function handleClear() {
  localQuery.value = '';
  locationSearchStore.clearAll();
  inputRef.value?.focus();
}

function handleKeydown(event) {
  // Prevent spacebar and other keys from interfering with map controls
  event.stopPropagation();
}

function handleKeyup(event) {
  event.stopPropagation();
}

function handleKeypress(event) {
  event.stopPropagation();

  if (event.key === 'Enter') {
    // Trigger immediate search on Enter
    locationSearchStore.search(localQuery.value);
  }
}

defineExpose({
  focus: () => inputRef.value?.focus(),
});
</script>

<template>
  <div class="relative mb-3">
    <input
      ref="inputRef"
      v-model="localQuery"
      type="text"
      class="search-input w-full rounded-[10px] border border-mm-bg-muted bg-[#0b1222] py-3 pl-3.5 pr-9 font-mono text-sm text-mm-text-primary transition-all duration-200 ease-in-out focus:border-mm-blue focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] focus:outline-none"
      placeholder="Search for a place..."
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @keypress="handleKeypress" />
    <button
      v-if="localQuery"
      class="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-mm-bg-light/30 text-base leading-none text-mm-text-muted transition-all duration-200 ease-in-out hover:bg-mm-error/30 hover:text-red-300"
      title="Clear search"
      @click="handleClear">
      ✕
    </button>
  </div>
</template>

<style scoped>
.search-input::placeholder {
  color: #64748b;
}
</style>
