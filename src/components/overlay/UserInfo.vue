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
  <div id="bm-contain-userinfo" class="flex flex-col gap-1.5 mt-[0.5em] transition-[opacity,height] duration-200 ease-in-out">
    <!-- Username -->
    <div v-if="showUsername" id="bm-user-name" class="flex items-center gap-1.5">
      <div id="bm-user-icon" v-html="icons.userIcon"></div>
      <p id="bm-user-name-content">
        <b>Username:</b> {{ userName ?? 'loading...' }}
      </p>
    </div>

    <!-- Droplets -->
    <div v-if="showDroplets" id="bm-user-droplets" class="flex items-center gap-1.5">
      <div id="bm-user-droplets-icon" v-html="icons.dropletIcon"></div>
      <p id="bm-user-droplets-content">
        <b>Droplets:</b> {{ dropletsFormatted || 'loading...' }}
      </p>
    </div>

    <!-- Next Level -->
    <div v-if="showNextLevel" id="bm-user-nextlevel" class="flex items-center gap-1.5">
      <div id="bm-user-nextlevel-icon" v-html="icons.userIcon"></div>
      <p v-if="pixelsToNextLevel" id="bm-user-nextlevel-content">
        Next level in <b>{{ pixelsToNextLevelFormatted }}</b> pixel{{ pixelsToNextLevel === 1 ? '' : 's' }}
      </p>
      <p v-else id="bm-user-nextlevel-content">Next level in...</p>
    </div>

    <!-- Full Charge Timer -->
    <div v-if="showFullCharge" id="bm-user-fullcharge" class="flex items-center gap-1.5">
      <div id="bm-user-fullcharge-icon" v-html="icons.chargeIcon"></div>
      <p id="bm-user-fullcharge-content">
        Full Charge in
        <b :class="{
          'text-mm-success': chargeStatus.type === 'full',
          'text-mm-warning-accent': chargeStatus.type === 'charging',
          'text-[#6b7280]': chargeStatus.type === 'na'
        }">{{ chargeStatus.text }}</b>
        <span v-if="chargeStatus.info" class="text-[#6b7280] text-[0.9em] ml-[0.25em]">{{ chargeStatus.info }}</span>
      </p>
    </div>
  </div>
</template>
