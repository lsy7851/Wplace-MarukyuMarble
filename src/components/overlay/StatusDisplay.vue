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
import { computed } from 'vue';
import { useStatusStore } from '@/stores/statusStore.js';
import { storeToRefs } from 'pinia';

const props = defineProps({
  version: {
    type: String,
    required: true
  }
});

const statusStore = useStatusStore();
const { displayText, hasMessage } = storeToRefs(statusStore);

// Show displayText if there's a message, otherwise show empty for placeholder
const textareaValue = computed(() => {
  return hasMessage.value ? displayText.value : '';
});

const placeholderText = computed(() => {
  return `Status: Sleeping...\nVersion: ${props.version}`;
});
</script>

<template>
  <textarea
    id="bm-output-status"
    :value="textareaValue"
    :placeholder="placeholderText"
    readonly
  ></textarea>
</template>

<style scoped>
/* Output status area */
#bm-output-status {
  font-size: 0.85rem;
  background: #1e293b;
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 0.5rem;
  height: 3.75em;
  width: 100%;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
  min-height: 3.75em;
  max-height: 15em;
  margin-top: 0.5em;
}
</style>
