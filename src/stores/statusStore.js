/**
 * Status Store - Volatile store for status display messages
 * @description Manages status messages shown in the overlay
 * @note This store is NOT persisted to storage
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useStatusStore = defineStore('status', () => {
  // ===== State =====

  /** Current status message */
  const message = ref('');

  /** Message type: 'status' | 'error' | 'idle' */
  const messageType = ref('idle');

  /** Timestamp of last message */
  const lastUpdated = ref(null);

  // ===== Getters =====

  /** Formatted display text with prefix */
  const displayText = computed(() => {
    if (messageType.value === 'idle' || !message.value) {
      return '';
    }

    if (messageType.value === 'error') {
      return `Error: ${message.value}`;
    }

    return `Status: ${message.value}`;
  });

  /** Is there an active message? */
  const hasMessage = computed(() => message.value !== '');

  /** Is current message an error? */
  const isError = computed(() => messageType.value === 'error');

  // ===== Actions =====

  /**
   * Display a status message
   * @param {string} text - The status text to display
   */
  function handleDisplayStatus(text) {
    message.value = text;
    messageType.value = 'status';
    lastUpdated.value = Date.now();

    // Also log to console (matching legacy behavior)
    console.info(`[MarukYu] ${text}`);
  }

  /**
   * Display an error message
   * @param {string} text - The error text to display
   */
  function handleDisplayError(text) {
    message.value = text;
    messageType.value = 'error';
    lastUpdated.value = Date.now();

    // Also log to console (matching legacy behavior)
    console.error(`[MarukYu] ${text}`);
  }

  /**
   * Clear the current message
   */
  function clearMessage() {
    message.value = '';
    messageType.value = 'idle';
  }

  // ===== Return =====

  return {
    // State
    message,
    messageType,
    lastUpdated,

    // Getters
    displayText,
    hasMessage,
    isError,

    // Actions
    handleDisplayStatus,
    handleDisplayError,
    clearMessage,
  };
});
