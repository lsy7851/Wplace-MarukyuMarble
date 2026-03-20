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
    class="text-[0.85rem] bg-mm-bg-dark border border-mm-bg-muted text-mm-text-muted p-2 h-[3.75em] w-full rounded-lg font-inherit resize-y min-h-[3.75em] max-h-[15em] mt-[0.5em]"
    :value="textareaValue"
    :placeholder="placeholderText"
    readonly
  ></textarea>
</template>
