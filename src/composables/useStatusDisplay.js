/**
 * Status Display Composable
 * @description Provides status display methods for use in components and other composables
 * Wraps the statusStore for convenient usage
 */

import { useStatusStore } from '@/stores/statusStore.js';
import { storeToRefs } from 'pinia';

/**
 * Use status display functionality
 * @returns {Object} Status display methods and state
 */
export function useStatusDisplay() {
  const statusStore = useStatusStore();

  // Extract reactive refs from store
  const { message, messageType, displayText, hasMessage, isError, lastUpdated } =
    storeToRefs(statusStore);

  /**
   * Display a status message
   * @param {string} text - The status text to display
   */
  function handleDisplayStatus(text) {
    statusStore.handleDisplayStatus(text);
  }

  /**
   * Display an error message
   * @param {string} text - The error text to display
   */
  function handleDisplayError(text) {
    statusStore.handleDisplayError(text);
  }

  /**
   * Clear the current message
   */
  function clearMessage() {
    statusStore.clearMessage();
  }

  return {
    // State (reactive refs)
    message,
    messageType,
    displayText,
    hasMessage,
    isError,
    lastUpdated,

    // Actions
    handleDisplayStatus,
    handleDisplayError,
    clearMessage,
  };
}
