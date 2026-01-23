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
  <div class="location-item" @click="handleClick">
    <div class="location-content">
      <div class="location-name">{{ primaryName }}</div>
      <div v-if="secondaryInfo" class="location-secondary">{{ secondaryInfo }}</div>
      <div v-if="fullAddress" class="location-address">{{ fullAddress }}</div>
    </div>

    <span
      v-if="showFavorite"
      class="favorite-star"
      :class="{ favorited: isFavorited }"
      :title="isFavorited ? 'Remove from favorites' : 'Add to favorites'"
      @click="handleFavoriteClick">
      ★
    </span>

    <span
      v-if="showRemove"
      class="remove-btn"
      title="Remove from favorites"
      @click="handleRemoveClick">
      ×
    </span>
  </div>
</template>

<style scoped>
.location-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.location-item:hover {
  background-color: rgba(51, 65, 85, 0.55);
  border-color: #334155;
  transform: translateX(2px);
}

.location-content {
  flex: 1;
  min-width: 0;
}

.location-name {
  font-weight: 600;
  font-size: 14px;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.location-secondary {
  font-size: 12px;
  color: #cbd5e1;
  margin-bottom: 2px;
}

.location-address {
  font-size: 11px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-star {
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.favorite-star:hover {
  color: #fbbf24;
  transform: scale(1.2);
}

.favorite-star.favorited {
  color: #fbbf24;
}

.remove-btn {
  font-size: 24px;
  font-weight: bold;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  line-height: 1;
}

.remove-btn:hover {
  color: #ef4444;
  transform: scale(1.2);
}
</style>
