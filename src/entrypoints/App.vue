<script setup>
import Overlay from '@/components/Overlay.vue';
import { useApiMessages } from '@/composables/useApiMessages.js';

// Initialize API message listener
// This will receive messages from API Interceptor (MAIN world)
// and distribute them to appropriate stores
useApiMessages();
</script>

<template>
  <Overlay></Overlay>
</template>

<style scoped>
</style>