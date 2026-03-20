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
import { onMounted, onUnmounted } from 'vue';
import Overlay from '@/components/Overlay.vue';
import { useApiMessages } from '@/composables/ui/useApiMessages.js';
import { useTemplateStore } from '@/stores/templateStore';
import { useCanvasOverlay } from '@/composables/ui/useCanvasOverlay';

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
  canvasOverlay.setupOverlay();
});

// Cleanup on unmount
onUnmounted(() => {
  canvasOverlay.teardownOverlay();
});
</script>

<template>
  <Overlay></Overlay>
</template>

<style>
@import '@/style.css';
</style>
