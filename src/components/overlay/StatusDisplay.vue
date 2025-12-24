<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  version: {
    type: String,
    required: true
  }
});
</script>

<template>
  <textarea
    id="bm-output-status"
    :placeholder="`Status: Sleeping...\nVersion: ${version}`"
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
