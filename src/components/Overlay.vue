<script setup>
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
import StatusDisplay from './overlay/StatusDisplay.vue';
import ActionButtons from './overlay/ActionButtons.vue';
import LocationSearchModal from './modals/LocationSearchModal.vue';

const minimized = ref(false);
const version = '0.91.2';

const showInformationHeader = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('bmShowInformationHeader') ?? 'true');
  } catch (e) {
    return true;
  }
});

const showTemplateHeader = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('bmShowTemplateHeader') ?? 'true');
  } catch (e) {
    return true;
  }
});

// Draggable setup
const overlayRef = useTemplateRef('overlayRef');
const dragBarRef = useTemplateRef('dragBarRef');

const { x, y, style: draggableStyle, isDragging } = useDraggable(overlayRef, {
  initialValue: { x: 80, y: 10 },
  preventDefault: true,
  handle: dragBarRef,
});

// todo Implementing Later
setTimeout(() => {
  // updateColorMenuDisplay(true, true);
}, 2000);

// todo Implementing Later
setTimeout(() => {
  // initColorMenuResize()
}, 100);
</script>

<template>
  <div id="bm-overlay" ref="overlayRef" :style="draggableStyle">
    <div id="bm-contain-header">
      <DragBar ref="dragBarRef" :class="{minimized:minimized}" />
      <Title v-model:minimized="minimized" :class="{minimized:minimized}" />
      <Header
        v-if="showInformationHeader"
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
        <ColorMenu :class="{minimized:minimized}" />
        <TemplateButtons
          :class="{minimized:minimized}"
          :icons="icons" />
        <StatusDisplay
          :class="{minimized:minimized}"
          :version="version" />
        <ActionButtons
          :class="{minimized:minimized}"
          :icons="icons"
          :version="version" />
      </div>
    </div>

    <!-- Location Search Modal -->
    <LocationSearchModal />
  </div>
</template>

<style scoped>

/* The entire overlay */
#bm-overlay {
  position: fixed;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #f1f5f9;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid #334155;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  z-index: 9000;
  transition: opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  max-width: 320px;
  width: auto;
  /* Performance optimizations for smooth dragging */
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
}

/* Smooth transitions for minimize/maximize functionality */
#bm-overlay hr,
#bm-contain-automation,
#bm-contain-buttons-action {
  transition: opacity 0.2s ease, height 0.2s ease;
}

/* The entire overlay BUT it is cascading */
div#bm-overlay {
  /* Modern font stack consistent with other overlays */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.01em;

  flex-direction: column;
  gap: .5rem;

  padding: .5rem;
}

/* Disable interactions during drag for better performance */
#bm-overlay:has(#bm-bar-drag.dragging) {
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}


/* The container for the overlay header */
#bm-contain-header {
  margin-bottom: 0.5em;
}

/* When minimized, adjust header container */
#bm-contain-header[style*="text-align: center"] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Ensure overlay maintains consistent width when minimized */
#bm-overlay[style*="padding: 5px"] {
  width: auto !important;
  max-width: 100px;
  min-width: 150px;
}

/* The Blue Marble image (Old style - commented out in favor of redesign)
#bm-overlay img {
  display: inline-block;
  height: 2.5em;
  margin-right: 1ch;
  vertical-align: middle;
  transition: opacity 0.2s ease;
} */

/* When overlay is minimized, adjust image styling */
#bm-contain-header[style*="text-align: center"] img {
  margin-right: 0;
  margin-left: 0;
  display: block;
  margin: 0 auto;
}

/* Ensure drag bar remains functional when minimized */
#bm-bar-drag {
  transition: margin-bottom 0.2s ease;
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

/* Container for action buttons, that is inside the action button container */
div:has(> #bm-button-teleport) {
  display: flex;
  gap: 0.5ch;
}

/* Favorite (Star) button image */
/* Templates (Person) button image */
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

/* All overlay buttons (Old style - commented out in favor of redesign)
#bm-overlay button {
  background-color: #144eb9;
  border-radius: 1em;
  padding: 0 0.75ch;
}

#bm-overlay button:hover, #bm-overlay button:focus-visible {
  background-color: #1061e5;
}

#bm-overlay button:active,
#bm-overlay button:disabled {
  background-color: #2e97ff;
}

#bm-overlay button:disabled {
  text-decoration: line-through;
} */

/* Color filter overlay styles */
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

/* Mini progress tracker styles - Slate theme */
#bm-mini-tracker {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  cursor: default;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

#bm-mini-tracker:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

#bm-mini-tracker:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  opacity: 0;
  transition: opacity 0.2s ease;
}

#bm-mini-tracker:hover:before {
  opacity: 1;
}

/* The Blue Marble image */
#bm-overlay img {
  height: 2rem;
  transition: opacity 0.2s ease;
}


/* All overlay buttons */
#bm-overlay button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .25rem;

  padding: .125rem .5rem;

  background-color: #2190ED;
  border-radius: .25rem;

  transition: background-color 0.25s;

  /* Handle text overflow */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0; /* Allow flex items to shrink below content size */
}

/* All overlay buttons when hovered/focused */
#bm-overlay button:hover, #bm-overlay button:focus-visible {
  background-color: #3b9def;
}

/* All overlay buttons when pressed (plus disabled color) */
#bm-overlay button:active,
#bm-overlay button:disabled {
  background-color: #50a9f1;
}

/* All overlay buttons when disabled */
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

/* Minimized state styles */
.minimized {
  display: none !important;
}

/* When overlay is minimized, adjust overlay dimensions */
#bm-overlay:has(.minimized) {
  width: 72px;
  height: 76px;
  max-width: 72px;
  min-width: 72px;
  padding: 6px;
}
</style>
