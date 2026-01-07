<script setup>
import { onMounted, onUnmounted } from 'vue';
import Overlay from '@/components/Overlay.vue';
import { useApiMessages } from '@/composables/useApiMessages.js';
import { useTemplateStore } from '@/stores/templateStore';
import { useCanvasOverlay } from '@/composables/useCanvasOverlay';

// Initialize API message listener
// This will receive messages from API Interceptor (MAIN world)
// and distribute them to appropriate stores
useApiMessages();

// Initialize template store
const templateStore = useTemplateStore();

// Initialize canvas overlay for template rendering
const canvasOverlay = useCanvasOverlay();

// Load templates from chrome.storage.sync on app mount
onMounted(async () => {
  await templateStore.loadTemplates();
  console.log('[App] Templates loaded on mount');

  // Setup canvas overlay after templates are loaded
  canvasOverlay.setupOverlay();
  console.log('[App] Canvas overlay initialized');
});

// Cleanup on unmount
onUnmounted(() => {
  canvasOverlay.teardownOverlay();
  console.log('[App] Canvas overlay cleaned up');
});
</script>

<template>
  <Overlay></Overlay>
</template>

<style scoped>
</style>