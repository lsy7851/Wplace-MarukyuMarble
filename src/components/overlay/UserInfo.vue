<script setup>
import * as icons from '@@/old-src/icons.js';
import { useUserStore } from '@/stores/userStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const userStore = useUserStore();
const settingsStore = useSettingsStore();

// Extract only the refs we need from user store
const {
  userName,
  dropletsFormatted,
  pixelsToNextLevel,
  pixelsToNextLevelFormatted,
  currentCharges,
  maxCharges,
  timeToFullChargeFormatted,
  isFullyCharged,
} = storeToRefs(userStore);

// Extract visibility settings from settings store
const { showUsername, showDroplets, showNextLevel, showFullCharge } = storeToRefs(settingsStore);

// Computed for charge display status
const chargeStatus = computed(() => {
  if (isFullyCharged.value || timeToFullChargeFormatted.value === 'FULL') {
    return { type: 'full', text: 'FULL' };
  }
  if (timeToFullChargeFormatted.value) {
    return {
      type: 'charging',
      text: timeToFullChargeFormatted.value,
      info: `(${Math.floor(currentCharges.value)}/${maxCharges.value})`,
    };
  }
  return { type: 'na', text: 'N/A' };
});
</script>
<template>
  <div id="bm-contain-userinfo">
    <!-- Username -->
    <div v-if="showUsername" id="bm-user-name">
      <div id="bm-user-icon" v-html="icons.userIcon"></div>
      <p id="bm-user-name-content">
        <b>Username:</b> {{ userName ?? 'loading...' }}
      </p>
    </div>

    <!-- Droplets -->
    <div v-if="showDroplets" id="bm-user-droplets">
      <div id="bm-user-droplets-icon" v-html="icons.dropletIcon"></div>
      <p id="bm-user-droplets-content">
        <b>Droplets:</b> {{ dropletsFormatted || 'loading...' }}
      </p>
    </div>

    <!-- Next Level -->
    <div v-if="showNextLevel" id="bm-user-nextlevel">
      <div id="bm-user-nextlevel-icon" v-html="icons.userIcon"></div>
      <p v-if="pixelsToNextLevel" id="bm-user-nextlevel-content">
        Next level in <b>{{ pixelsToNextLevelFormatted }}</b> pixel{{ pixelsToNextLevel === 1 ? '' : 's' }}
      </p>
      <p v-else id="bm-user-nextlevel-content">Next level in...</p>
    </div>

    <!-- Full Charge Timer -->
    <div v-if="showFullCharge" id="bm-user-fullcharge">
      <div id="bm-user-fullcharge-icon" v-html="icons.chargeIcon"></div>
      <p id="bm-user-fullcharge-content">
        Full Charge in
        <b :class="`charge-${chargeStatus.type}`">{{ chargeStatus.text }}</b>
        <span v-if="chargeStatus.info" class="charge-info">{{ chargeStatus.info }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Information section */
#bm-contain-userinfo {
  display: flex;
  flex-direction: column;
  gap: .375rem;
}

#bm-contain-userinfo > div {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* The elements that need spacing from each-other */
#bm-contain-userinfo {
  margin-top: 0.5em;
}

/* Smooth transitions for minimize/maximize functionality */
#bm-contain-userinfo {
  transition: opacity 0.2s ease, height 0.2s ease;
}

/* Full Charge specific styles */
.charge-full {
  color: #10b981; /* Green for FULL */
}

.charge-charging {
  color: #f59e0b; /* Orange for countdown */
}

.charge-na {
  color: #6b7280; /* Gray for N/A */
}

.charge-info {
  color: #6b7280;
  font-size: 0.9em;
  margin-left: 0.25em;
}
</style>