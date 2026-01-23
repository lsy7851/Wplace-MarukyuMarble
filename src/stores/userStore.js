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
 * User Store - Volatile (non-persistent) store for user information
 * @description Stores user info, droplets, level progress, and charge timing
 * @note This store is NOT persisted to storage - data is lost on extension reload
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useChargeTimer } from '@/composables/useChargeTimer.js';

export const useUserStore = defineStore('user', () => {
  // ===== State (Volatile - not persisted) =====

  /** Raw user info from /api/me */
  const userInfo = ref(null);

  /** Last time user info was updated */
  const lastUpdated = ref(null);

  /** Charge timer composable */
  const {
    chargeData,
    isFullyCharged,
    timeToFullChargeFormatted,
    setChargeData,
    resetChargeData,
  } = useChargeTimer();

  // ===== Getters =====

  /** User ID */
  const userId = computed(() => userInfo.value?.id ?? null);

  /** Username */
  const userName = computed(() => userInfo.value?.name ?? 'Guest');

  /** Current level */
  const level = computed(() => userInfo.value?.level ?? 0);

  /** Total pixels painted */
  const pixelsPainted = computed(() => userInfo.value?.pixelsPainted ?? 0);

  /** Current droplets (물방울) */
  const droplets = computed(() => userInfo.value?.droplets ?? 0);

  /** Formatted droplets with thousands separator */
  const dropletsFormatted = computed(() => {
    return new Intl.NumberFormat().format(droplets.value);
  });

  /**
   * Pixels needed to reach next level
   * Formula from old-src/apiManager.js:74
   */
  const pixelsToNextLevel = computed(() => {
    if (!userInfo.value) return 0;

    const currentLevel = Math.floor(level.value);
    const painted = pixelsPainted.value;

    const nextLevelTotal = Math.pow(currentLevel * Math.pow(30, 0.65), (1 / 0.65));
    const remaining = Math.ceil(nextLevelTotal - painted);

    return Math.max(0, remaining);
  });

  /** Formatted pixels to next level */
  const pixelsToNextLevelFormatted = computed(() => {
    return new Intl.NumberFormat().format(pixelsToNextLevel.value);
  });

  /** Is user logged in? */
  const isLoggedIn = computed(() => userInfo.value !== null);

  // ===== Actions =====

  /**
   * Set user information from /api/me response
   * @param {Object} data - User data from API
   */
  function setUserInfo(data) {
    userInfo.value = {
      id: data.id,
      name: data.name,
      level: data.level,
      pixelsPainted: data.pixelsPainted,
      droplets: data.droplets,
    };

    setChargeData(data);
    lastUpdated.value = Date.now();
  }

  /**
   * Clear all user information
   * Called on logout or extension disable
   */
  function clearUserInfo() {
    userInfo.value = null;
    resetChargeData();
    lastUpdated.value = null;
  }

  /**
   * Refresh charge data
   * Called when user paints a pixel
   */
  function refreshChargeData(newChargeData) {
    if (!newChargeData) return;

    setChargeData(newChargeData);
  }

  // ===== Return =====

  return {
    // State
    userInfo,
    lastUpdated,

    // User getters
    userId,
    userName,
    level,
    pixelsPainted,
    droplets,
    dropletsFormatted,
    pixelsToNextLevel,
    pixelsToNextLevelFormatted,
    isLoggedIn,

    // Charge data (from composable)
    currentCharges: computed(() => chargeData.currentCharges),
    remainingMs: computed(() => chargeData.remainingMs),
    canPaint: computed(() => chargeData.canPaint),

    // Aliases for compatibility
    charges: computed(() => chargeData.current),
    maxCharges: computed(() => chargeData.max),

    // Charge computed
    isFullyCharged,
    timeToFullChargeFormatted,

    // Actions
    setUserInfo,
    clearUserInfo,
    refreshChargeData,
  };

  // ===== NOTE: No persist option =====
  // This store is intentionally volatile and will not persist to storage
});
