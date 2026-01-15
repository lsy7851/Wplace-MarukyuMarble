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
