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
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useServerStore = defineStore('server', () => {
    // Default fallback URL if detection fails
    const tileServerBaseUrl = ref('https://wplace.live/api/files/s0/tiles');
    const isDetected = ref(false);

    /**
     * Update the tile server URL from detected endpoint
     * @param {string} url - Full URL or base URL
     */
    function setTileServerUrl(url) {
        if (!url) return;

        // Ensure we have a clean base URL (remove trailing slashes, ensure it ends with /tiles if it looks like a tile path)
        // The interceptor might send "https://wplace.live/api/files/s0/tiles"
        let cleanUrl = url;

        // If we received a full tile URL (e.g. ends in .png), strip it
        if (url.includes('/tiles/')) {
            const parts = url.split('/tiles/');
            cleanUrl = `${parts[0]}/tiles`;
        }

        tileServerBaseUrl.value = cleanUrl;
        isDetected.value = true;
    }

    return {
        tileServerBaseUrl,
        isDetected,
        setTileServerUrl
    };
});
