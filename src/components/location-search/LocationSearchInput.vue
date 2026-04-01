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
import BaseInput from '@/components/common/BaseInput.vue';
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
  focus: () => inputRef.value?.focus?.(),
});
</script>

<template>
  <div class="mb-3">
    <BaseInput
      ref="inputRef"
      v-model="localQuery"
      placeholder="Search for a place..."
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @keypress="handleKeypress">
      <template #suffix>
        <button
          v-if="localQuery"
          class="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-mm-bg-light/30 text-base leading-none text-mm-text-muted transition-all duration-200 ease-in-out hover:bg-mm-error/30 hover:text-red-300"
          title="Clear search"
          @click="handleClear">
          ✕
        </button>
      </template>
    </BaseInput>
  </div>
</template>
