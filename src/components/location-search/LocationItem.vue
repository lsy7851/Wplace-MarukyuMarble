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
import { computed } from 'vue';

const props = defineProps({
  /**
   * Location data
   */
  location: {
    type: Object,
    required: true,
  },
  /**
   * Is location favorited
   */
  isFavorited: {
    type: Boolean,
    default: false,
  },
  /**
   * Show favorite star
   */
  showFavorite: {
    type: Boolean,
    default: true,
  },
  /**
   * Show remove button (for favorites list)
   */
  showRemove: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click', 'toggle-favorite', 'remove']);

const primaryName = computed(() => props.location.primaryName || 'Unknown');
const secondaryInfo = computed(() => props.location.secondaryInfo || '');
const fullAddress = computed(() => props.location.fullAddress || '');

function handleClick() {
  emit('click', props.location);
}

function handleFavoriteClick(event) {
  event.stopPropagation();
  emit('toggle-favorite', props.location);
}

function handleRemoveClick(event) {
  event.stopPropagation();
  emit('remove', props.location);
}
</script>

<template>
  <div
    class="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-mm-bg-darkest/40 p-3 transition-all duration-200 ease-in-out hover:translate-x-0.5 hover:border-mm-bg-border hover:bg-mm-bg-border/55"
    @click="handleClick">
    <div class="min-w-0 flex-1">
      <div class="mb-1 text-sm font-semibold text-mm-text-primary">{{ primaryName }}</div>
      <div v-if="secondaryInfo" class="mb-0.5 text-xs text-mm-text-muted">{{ secondaryInfo }}</div>
      <div v-if="fullAddress" class="truncate text-[11px] text-mm-text-secondary">{{ fullAddress }}</div>
    </div>

    <span
      v-if="showFavorite"
      class="cursor-pointer select-none text-xl text-mm-bg-light transition-all duration-200 ease-in-out hover:scale-120 hover:text-mm-warning"
      :class="{ 'text-mm-warning': isFavorited }"
      :title="isFavorited ? 'Remove from favorites' : 'Add to favorites'"
      @click="handleFavoriteClick">
      ★
    </span>

    <span
      v-if="showRemove"
      class="cursor-pointer select-none text-2xl font-bold leading-none text-mm-bg-light transition-all duration-200 ease-in-out hover:scale-120 hover:text-mm-error"
      title="Remove from favorites"
      @click="handleRemoveClick">
      ×
    </span>
  </div>
</template>
