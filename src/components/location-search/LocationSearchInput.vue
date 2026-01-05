<script setup>
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
  <div class="search-input-container">
    <input
      ref="inputRef"
      v-model="localQuery"
      type="text"
      class="search-input"
      placeholder="Search for a place..."
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @keypress="handleKeypress" />
    <button
      v-if="localQuery"
      class="clear-btn"
      title="Clear search"
      @click="handleClear">
      ✕
    </button>
  </div>
</template>

<style scoped>
.search-input-container {
  position: relative;
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 12px 14px;
  padding-right: 36px;
  border-radius: 10px;
  border: 1px solid #475569;
  background: #0b1222;
  color: #f1f5f9;
  font: 14px monospace;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  outline: none;
}

.search-input::placeholder {
  color: #64748b;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(100, 116, 139, 0.3);
  color: #cbd5e1;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}
</style>
