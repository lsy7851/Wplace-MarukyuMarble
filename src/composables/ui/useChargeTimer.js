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
/**
 * Charge Timer Composable
 * @description Manages charge countdown timer and charge calculations
 * @note Extracted from userStore.js for better separation of concerns
 */

import { computed, reactive } from 'vue';

export function useChargeTimer() {
  // ===== State =====

  const chargeData = reactive({
    current: 0,
    max: 1,
    cooldownMs: 30000,
    timeToFull: 0,
    startTime: null,
    remainingMs: 0,
    currentCharges: 0,
    canPaint: false,
  });

  let timerInterval = null;

  // ===== Computed =====

  const isFullyCharged = computed(() => {
    return chargeData.currentCharges >= chargeData.max;
  });

  const timeToFullChargeFormatted = computed(() => {
    if (!chargeData.startTime) return null;

    const remainingMs = chargeData.remainingMs;

    if (chargeData.currentCharges >= chargeData.max || remainingMs <= 0) {
      return 'FULL';
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  });

  // ===== Methods =====

  /**
   * Update charge display (called every second)
   */
  function updateChargeDisplay() {
    if (!chargeData.startTime) return;

    const elapsed = Date.now() - chargeData.startTime;
    const remainingMs = Math.max(0, chargeData.timeToFull - elapsed);

    const currentChargesFloat = chargeData.current + (elapsed / chargeData.cooldownMs);
    const newCurrentCharges = Math.min(currentChargesFloat, chargeData.max);

    chargeData.remainingMs = remainingMs;
    chargeData.currentCharges = newCurrentCharges;

    if (newCurrentCharges >= chargeData.max || remainingMs <= 0) {
      stopTimer();
    }
  }

  /**
   * Start charge countdown timer
   */
  function startTimer() {
    stopTimer();

    if (!chargeData.startTime) return;

    updateChargeDisplay();

    timerInterval = setInterval(() => {
      updateChargeDisplay();
    }, 1000);
  }

  /**
   * Stop charge countdown timer
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * Initialize charge data from API response
   */
  function setChargeData(data) {
    const currentCharges = data.charges ?? 0;
    const maxCharges = data.maxCharges ?? 1;
    const cooldownMs = data.cooldownMs ?? 30000;
    const chargesNeeded = maxCharges - currentCharges;
    const timeToFullMs = chargesNeeded * cooldownMs;

    Object.assign(chargeData, {
      current: currentCharges,
      max: maxCharges,
      cooldownMs: cooldownMs,
      timeToFull: timeToFullMs,
      startTime: Date.now(),
      remainingMs: timeToFullMs,
      currentCharges: currentCharges,
      canPaint: data.canPaint ?? (currentCharges >= 1),
    });

    startTimer();
  }

  /**
   * Reset charge data
   */
  function resetChargeData() {
    stopTimer();

    Object.assign(chargeData, {
      current: 0,
      max: 1,
      cooldownMs: 30000,
      timeToFull: 0,
      startTime: null,
      remainingMs: 0,
      currentCharges: 0,
      canPaint: false,
    });
  }

  return {
    // Data (reactive)
    chargeData,

    // Computed
    isFullyCharged,
    timeToFullChargeFormatted,

    // Methods
    setChargeData,
    resetChargeData,
    stopTimer,
  };
}
