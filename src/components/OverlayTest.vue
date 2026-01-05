<script setup>
const clickBtn = () => {
  alert('⑨ Cirno Marble is working!');
};
</script>

<template>
  <div class="marukyu-overlay">
    <h3>⑨ Marukyu Marble</h3>
    <p>Template overlay tool</p>
    <button id="marukyu-test-btn" @click="clickBtn">Test Button</button>
  </div>
</template>

<style scoped>
/* Marukyu Marble - Basic Styles */
.marukyu-overlay {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #4a90e2;
  border-radius: 8px;
  padding: 16px;
  z-index: 10000;
  font-family: Arial, sans-serif;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.marukyu-overlay h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
}

.marukyu-overlay button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.marukyu-overlay button:hover {
  background: #357abd;
}
</style>