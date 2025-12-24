<script setup>
import { computed } from 'vue';

const showColorMenu = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('bmShowColorMenu') ?? 'true');
  } catch (e) {
    return true;
  }
});
</script>
<template>
  <div v-if="showColorMenu" id="bm-color-menu">
    <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
      <div>
        <input
          id="bm-color-search" autocomplete="off" placeholder="🔍 Search colors..."
          style="flex: 1; padding: 4px 8px; font-size: 11px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: rgba(255,255,255,0.1); color: white; min-width: 0; max-width: 120px;"
          type="text" />
      </div>
      <div>
        <select
          id="bm-color-sort"
          style="padding: 4px 6px; font-size: 11px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: rgba(255,255,255,0.1); color: white; flex: 1; min-width: 80px;">
          <option style="background: #2a2a2a; color: white;" value="default">Default</option>
          <option style="background: #2a2a2a; color: white;" value="premium">Premium 💧</option>
          <option style="background: #2a2a2a; color: white;" value="most-wrong">Most Wrong</option>
          <option style="background: #2a2a2a; color: white;" value="most-missing">Most Missing</option>
          <option style="background: #2a2a2a; color: white;" value="less-missing">Less Missing</option>
          <option style="background: #2a2a2a; color: white;" value="most-painted">Most Painted</option>
          <option style="background: #2a2a2a; color: white;" value="less-painted">Less Painted</option>
          <option style="background: #2a2a2a; color: white;" value="enhanced">Enhanced Only</option>
          <option style="background: #2a2a2a; color: white;" value="name-asc">Name A-Z</option>
          <option style="background: #2a2a2a; color: white;" value="name-desc">Name Z-A</option>
        </select>
      </div>
      <div>
        <button
          id="bm-color-toggle-all"
          style="padding: 4px 8px; font-size: 11px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: rgba(255,255,255,0.1); color: white; cursor: pointer; white-space: nowrap;"
          title="Enable/Disable All Colors">
          ⚡
        </button>
      </div>
    </div>
    <div id="bm-color-list">
    </div>
    <div id="bm-color-menu-resize-handle">
      <div style="width: 30px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px;"></div>
    </div>
  </div>
</template>

<style scoped>

#bm-color-menu {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

#bm-color-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

#bm-color-menu-resize-handle {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: ns-resize;
  border-radius: 0 0 6px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

</style>