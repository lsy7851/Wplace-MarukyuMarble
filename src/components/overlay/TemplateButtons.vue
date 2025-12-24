<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps({
  icons: {
    type: Object,
    required: true,
  },
});

const fileInputRef = ref(null);
const isPaused = ref(false);

const handleUploadClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    // TODO: Implement file upload logic
    console.log('File selected:', file.name);
  }
};

const handleCreate = () => {
  // TODO: Implement template creation logic
  console.log('Create template clicked');
};

const handleManage = () => {
  // TODO: Implement template management dialog
  console.log('Manage templates clicked');
};

const handlePause = () => {
  // TODO: Implement tile pause/resume logic
  isPaused.value = !isPaused.value;
  console.log('Pause tiles clicked');
};

const handleColorFilter = () => {
  // TODO: Implement color filter overlay
  console.log('Color filter clicked');
};
</script>

<template>
  <div id="bm-contain-buttons-template">
    <!-- Upload Template Button (Row 1 - spans all 3 columns) -->
    <div>
      <button @click="handleUploadClick">
        <span v-html="icons.uploadIcon"></span>
        Upload Template
      </button>
      <input
        ref="fileInputRef"
        id="bm-input-file-template"
        type="file"
        accept="image/png, image/jpeg, image/webp, image/bmp, image/gif"
        @change="handleFileChange"
      />
    </div>

    <!-- Row 2: Create, Manage, Pause Tiles buttons -->
    <button id="bm-button-create" @click="handleCreate">
      <span v-html="icons.createIcon"></span>
      Create
    </button>
    <button id="bm-button-manage" @click="handleManage">
      <span v-html="icons.manageIcon"></span>
      Manage
    </button>
    <button
      id="bm-button-pause-tiles"
      @click="handlePause"
      :class="{paused: isPaused}">
      <span v-html="icons.pauseIcon"></span>
      Pause
    </button>

    <!-- Row 3: Color Filter button (spans all 3 columns) -->
    <button id="bm-button-color-filter" @click="handleColorFilter">
      <span v-html="icons.colorFilterIcon"></span>
      Color Filter
    </button>
  </div>
</template>

<style scoped>
/* Template buttons container - 3x4 grid layout */
#bm-contain-buttons-template {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto auto auto;
  align-items: stretch;
  gap: .25rem;
  margin-top: 0.5em;
}

/* Base button styles (inherited from Overlay.vue but need to be defined in scoped) */
#bm-contain-buttons-template button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .25rem;
  padding: .125rem .5rem;
  background-color: #2190ED;
  border-radius: .25rem;
  border: none;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: background-color 0.25s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

#bm-contain-buttons-template button:hover,
#bm-contain-buttons-template button:focus-visible {
  background-color: #3b9def;
}

#bm-contain-buttons-template button:active {
  background-color: #50a9f1;
}

/* SVG icon styling */
#bm-contain-buttons-template button span {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

#bm-contain-buttons-template button span :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

/* Row 1: Upload Template (spans all 3 columns - full width) */
div:has(> #bm-input-file-template) {
  grid-column: 1 / span 3;
  grid-row: 1;
}

/* Row 3: Color Filter (spans all 3 columns - full width) */
#bm-button-color-filter {
  grid-column: 1 / span 3;
  background: linear-gradient(45deg, #475569, #6366f1, #8b5cf6, #3b82f6, #64748b, #475569);
  background-size: 300% 300%;
  animation: colorShift 3s ease-in-out infinite;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  width: 100%;
}

#bm-button-color-filter:hover,
#bm-button-color-filter:focus-visible {
  animation-duration: 1s;
  transform: scale(1.05);
}

@keyframes colorShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

div:has(> #bm-input-file-template) > button {
  width: 100%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}

/* Force complete invisibility of file input to prevent native browser text */
#bm-input-file-template,
input[type="file"][id*="template"] {
  display: none !important;
  visibility: hidden !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  z-index: -9999 !important;
  pointer-events: none !important;
}

/* Row 2: Create, Manage, Pause Tiles buttons */
#bm-button-create {
  grid-row: 2;
  grid-column: 1;
}

#bm-button-manage {
  grid-row: 2;
  grid-column: 2;
}

#bm-button-pause-tiles {
  grid-row: 2;
  grid-column: 3;
  background-color: #50a9f1 !important;
  transition: all 0.3s ease !important;
  font-size: 0.85rem;
  padding: .125rem .25rem;
}

#bm-button-pause-tiles:hover {
  background-color: #f57c00 !important;
  transform: translateY(-1px);
}

#bm-button-pause-tiles:active,
#bm-button-pause-tiles:focus-visible {
  background-color: #ef6c00 !important;
}

/* Pause button when paused (green state) */
#bm-button-pause-tiles.paused {
  background-color: #4CAF50 !important;
}

#bm-button-pause-tiles.paused:hover {
  background-color: #45a049 !important;
}

#bm-button-pause-tiles.paused:active,
#bm-button-pause-tiles.paused:focus-visible {
  background-color: #3d8b40 !important;
}
</style>
