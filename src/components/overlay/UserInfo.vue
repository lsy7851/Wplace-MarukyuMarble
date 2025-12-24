<script setup>
import * as icons from '../../../old-src/icons.js';
</script>
<template>
  <div id="bm-contain-userinfo">
    <div id="bm-user-name">
      <div id="bm-user-icon" v-html="icons.userIcon"></div>
      <p id="bm-user-name-content"><b>Username:</b> loading...</p>
    </div>
    <div id="bm-user-droplets">
      <div id="bm-user-droplets-icon" v-html="icons.dropletIcon"></div>
      <p id="bm-user-droplets-content"><b>Droplets:</b> loading...</p>
    </div>
    <div id="bm-user-nextlevel">
      <div id="bm-user-nextlevel-icon" v-html="icons.userIcon"></div>
      <p id="bm-user-nextlevel-content">Next level in...</p>
    </div>
    <div id="bm-user-fullcharge">
      <div id="bm-user-fullcharge-icon" v-html="icons.chargeIcon"></div>
      <p id="bm-user-fullcharge-content">Full Charge in...</p>
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

</style>