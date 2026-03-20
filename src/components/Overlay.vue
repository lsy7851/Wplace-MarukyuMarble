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
import { computed, ref } from 'vue';
import { useDraggable } from '@vueuse/core';
import * as icons from '@@/old-src/icons.js';
import DragBar from './overlay/DragBar.vue';
import Title from './overlay/Title.vue';
import UserInfo from './overlay/UserInfo.vue';
import Header from './overlay/Header.vue';
import ColorMenu from './overlay/ColorMenu.vue';
import CoordinatesInput from './overlay/CoordinatesInput.vue';
import TemplateButtons from './overlay/TemplateButtons.vue';
import MiniProgressTracker from './overlay/MiniProgressTracker.vue';
import StatusDisplay from './overlay/StatusDisplay.vue';
import ActionButtons from './overlay/ActionButtons.vue';
import LocationSearchModal from './modals/LocationSearchModal.vue';
import SettingsModal from './modals/SettingsModal.vue';
import WrongPixelsModal from './modals/WrongPixelsModal.vue';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useTileCache } from '@/composables/storage/useTileCache.js';
import { storeToRefs } from 'pinia';

const minimized = ref(false);
const version = '0.91.2';
const showSettingsModal = ref(false);
const showWrongPixelsModal = ref(false);

// Settings store
const settingsStore = useSettingsStore();

// Visibility settings from store
const showTemplateHeader = computed(() => settingsStore.showTemplateHeader);

// Mobile mode from store
const mobileMode = computed(() => settingsStore.mobileMode);

// Draggable setup
const overlayRef = useTemplateRef('overlayRef');
const dragBarRef = useTemplateRef('dragBarRef');

const { x, y, style: draggableStyle, isDragging } = useDraggable(overlayRef, {
  initialValue: { x: 80, y: 10 },
  preventDefault: true,
  handle: computed(() => dragBarRef.value?.$el),
});

// todo Implementing Later
setTimeout(() => {
  // updateColorMenuDisplay(true, true);
}, 2000);

// todo Implementing Later
setTimeout(() => {
  // initColorMenuResize()
}, 100);

// Tile cache for invalidation on settings change
const tileCache = useTileCache();

// Handle error map toggle
function handleErrorMapToggle() {
  tileCache.invalidateForSettingsChange();
}
</script>

<template>
  <div
    id="bm-overlay"
    ref="overlayRef"
    class="fixed bg-gradient-to-br from-mm-bg-darkest to-mm-bg-dark text-mm-text-primary p-2 rounded-2xl border border-mm-bg-border shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-[16px] z-[9000] transition-[opacity,background,box-shadow,width,height] duration-300 ease-in-out max-w-80 w-auto will-change-transform [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform-style:preserve-3d] font-sans tracking-tight flex-col gap-2"
    :style="draggableStyle"
    :class="{
      'is-minimized': minimized,
      'mobile-mode': mobileMode,
      '!transition-none': isDragging
    }">
    <div id="bm-contain-header" class="mb-2">
      <DragBar ref="dragBarRef" :minimized="minimized" />
      <Title v-model:minimized="minimized" />
      <Header
        v-if="settingsStore.showInformationHeader"
        :class="{minimized:minimized}"
        :icons="icons.informationIcon"
        headerText="Information" />
      <UserInfo :class="{minimized:minimized}" />
      <Header
        v-if="showTemplateHeader"
        :class="{minimized:minimized}"
        :icons="icons.templateIcon"
        headerText="Template" />
      <div id="bm-contain-automation">
        <CoordinatesInput :class="{minimized:minimized}" />
        <!-- Color Menu replaced by Modal, but maybe keep slot or remove if unused -->
        <ColorMenu :minimized="minimized" @request-maximize="minimized = false" />
        <TemplateButtons
          :class="{minimized:minimized}"
          :minimized="minimized"
          :icons="icons" />
        <MiniProgressTracker
          :class="{minimized:minimized}"
          :minimized="minimized" />
        <StatusDisplay
          :class="{minimized:minimized}"
          :version="version" />
        <ActionButtons
          :class="{minimized:minimized}"
          :icons="icons"
          :version="version"
          @open-settings="showSettingsModal = true"
          @open-wrong-pixels="showWrongPixelsModal = true"
          @toggle-error-map="handleErrorMapToggle" />
      </div>
    </div>

    <!-- Location Search Modal -->
    <LocationSearchModal />

    <!-- Settings Modal -->
    <SettingsModal v-model="showSettingsModal" :mobile-mode="mobileMode" />

    <!-- Wrong Pixels Modal -->
    <WrongPixelsModal v-model="showWrongPixelsModal" :mobile-mode="mobileMode" />

  </div>
</template>

<style scoped>
/* Smooth transitions for minimize/maximize child elements */
#bm-overlay hr,
#bm-contain-automation,
#bm-contain-buttons-action {
  transition: opacity 0.2s ease, height 0.2s ease;
}

/* Disable interactions during drag for better performance */
#bm-overlay:has(#bm-bar-drag.dragging) {
  pointer-events: none;
  user-select: none;
}

/* The Blue Marble header */
#bm-overlay h1 {
  display: inline-block;
  font-size: x-large;
  font-weight: bold;
  vertical-align: middle;
}

/* Checkboxes in the automation container */
#bm-contain-automation input[type="checkbox"] {
  vertical-align: middle;
  margin-right: 0.5ch;
}

/* Checkbox label/flavor text in the automation container */
#bm-contain-automation label {
  margin-right: 0.5ch;
}

/* SVG icons in buttons */
#bm-button-favorite svg,
#bm-button-template svg {
  height: 1em;
  margin: 0 auto;
  margin-top: 2px;
  text-align: center;
  line-height: 1em;
  vertical-align: bottom;
}

/* All small elements */
#bm-overlay small {
  font-size: x-small;
  color: lightgray;
}

/* Color filter overlay scrollbar */
#bm-color-filter-overlay {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

#bm-color-filter-overlay::-webkit-scrollbar {
  width: 8px;
}

#bm-color-filter-overlay::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

#bm-color-filter-overlay::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

#bm-color-filter-overlay::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Blue Marble image */
#bm-overlay img {
  height: 2rem;
  transition: opacity 0.2s ease;
}

/* All overlay buttons - cascading base styles */
#bm-overlay button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .25rem;
  padding: .125rem .5rem;
  background-color: #2190ED;
  border-radius: .25rem;
  transition: background-color 0.25s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

#bm-overlay button:hover,
#bm-overlay button:focus-visible {
  background-color: #3b9def;
}

#bm-overlay button:active,
#bm-overlay button:disabled {
  background-color: #50a9f1;
}

#bm-overlay button:disabled {
  text-decoration: line-through;
}

/* Enable button */
#bm-overlay button#bm-button-enable {
  background-color: #21c060;
}

#bm-overlay button#bm-button-enable:hover {
  background-color: #1daa55;
}

#bm-overlay button#bm-button-enable:active,
#bm-overlay button#bm-button-enable:focus-visible {
  background-color: #19944a;
}

/* Disable button */
#bm-overlay button#bm-button-disable {
  background-color: #d63838;
}

#bm-overlay button#bm-button-disable:hover {
  background-color: #cb2a2a;
}

#bm-overlay button#bm-button-disable:active,
#bm-overlay button#bm-button-disable:focus-visible {
  background-color: #b62525;
}

/* Minimized state - hide specific elements */
#bm-contain-header > .minimized,
#bm-contain-automation > .minimized:not(:has(#bm-button-color-filter)) {
  display: none !important;
}

/* When overlay is minimized, adjust overlay dimensions */
#bm-overlay.is-minimized {
  width: 72px;
  min-width: 72px;
  max-width: 72px;
  padding: 6px;
  gap: 0;
  overflow: visible !important;
  height: 76px !important;
}

/* Mobile mode */
#bm-overlay.mobile-mode {
  padding: 8px;
}

#bm-overlay.mobile-mode #bm-contain-header {
  margin-bottom: 0.25em;
}

#bm-overlay.mobile-mode button {
  min-height: 36px;
  padding: 0.25rem 0.5rem;
}

#bm-overlay.mobile-mode #bm-contain-automation {
  gap: 4px;
}
</style>
