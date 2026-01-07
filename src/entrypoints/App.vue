<script setup>
import { onMounted } from 'vue';
import Overlay from '@/components/Overlay.vue';
import { useApiMessages } from '@/composables/useApiMessages.js';
import { useTemplateStore } from '@/stores/templateStore';

// Initialize API message listener
// This will receive messages from API Interceptor (MAIN world)
// and distribute them to appropriate stores
useApiMessages();

// Initialize template store
const templateStore = useTemplateStore();

// Load templates from chrome.storage.sync on app mount
onMounted(async () => {
  await templateStore.loadTemplates();
  console.log('[App] Templates loaded on mount');
});
</script>

<template>
  <Overlay></Overlay>
</template>

<style scoped>
</style>