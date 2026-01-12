/**
 * API Interceptor - MAIN World Unlisted Script
 * @description Runs in page context (MAIN world) to intercept Wplace.live fetch requests
 * @note This is an unlisted script injected by content script using WXT's injectScript
 */

import { defineUnlistedScript } from 'wxt/sandbox';

export default defineUnlistedScript(() => {
  'use strict';

  const EXTENSION_NAME = 'Marukyu Marble';
  const MESSAGE_SOURCE = 'marukyu-marble-main';

  // ===== Tile processing queue (Promise-based) =====
  const tileBlobQueue = new Map();

  // ===== ISOLATED world로부터 메시지 수신 =====
  window.addEventListener('message', (event) => {
    // 보안: 같은 window에서 온 메시지만 처리
    if (event.source !== window) return;

    const message = event.data;

    // Handle messages from both ISOLATED world and Vue app (MAIN world)
    if (message.source === 'marukyu-marble-isolated') {
      // Messages from ISOLATED world (content script)
      switch (message.type) {
        case 'INIT_SETTINGS':
          // TODO: MAIN world에서 설정 사용
          break;

        case 'FLY_TO':
          handleFlyTo(message.data);
          break;

        case 'GET_MAP_STATUS':
          sendToIsolated('MAP_STATUS', {
            isReady: !!(window.mmmap && typeof window.mmmap.flyTo === 'function'),
            version: window.mmmap?.version || null,
            hasCenter: !!(window.mmmap && typeof window.mmmap.getCenter === 'function')
          });
          break;

        default:
          console.warn('⚠️ [MAIN] Unknown message type:', message.type);
      }
    } else if (message.source === MESSAGE_SOURCE && message.type === 'TILE_PROCESSED') {
      // Message from Vue app with processed tile
      const { blobID, processedBlob } = message;

      const queueEntry = tileBlobQueue.get(blobID);
      if (queueEntry) {
        tileBlobQueue.delete(blobID);
        console.log(`✅ [MAIN] Received processed tile blob ${blobID}`);
        queueEntry.resolve(processedBlob);
      } else {
        console.warn(`⚠️ [MAIN] No queue entry for blob ${blobID}`);
      }
    }
  });

  // ===== Helper: ISOLATED world로 메시지 전송 =====
  function sendToIsolated(type, data) {
    window.postMessage({
      source: MESSAGE_SOURCE,
      type: type,
      data: data,
      timestamp: Date.now()
    }, '*');
  }

  // ===== Helper: 엔드포인트 추출 =====
  /**
   * Extract endpoint name from URL
   * "wplace.live/api/me" -> "me"
   * "wplace.live/api/pixel/0/0?x=1&y=2" -> "pixel"
   * "wplace.live/api/files/s0/tiles/0/0/0.png" -> "tiles"
   */
  function extractEndpoint(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname
        .split('/')
        .filter(s => s && isNaN(Number(s))) // 숫자가 아닌 것만
        .filter(s => !s.includes('.')); // 확장자 제외

      return pathParts[pathParts.length - 1] || 'unknown';
    } catch (error) {
      console.error('❌ [MAIN] Failed to extract endpoint:', error);
      return 'unknown';
    }
  }

  // ===== MapLibre GL 인터셉터 설치 =====

  /**
   * Intercept MapLibre GL Map instance via Object.prototype.transform setter
   *
   * Based on code from "Wplace Zoom Plus & Location Manager" userscript
   * Original author: Kur0
   * Original script: https://greasyfork.org/en/scripts/548945-wplace-zoom-plus-location-manager
   * Licensed under MIT License
   *
   * Copyright (c) 2024 Kur0
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   * ---
   *
   * Modified for Marukyu Marble extension (MPL-2.0)
   *
   * How it works:
   * 1. MapLibre GL Map class internally sets `this.transform = new Transform()` during construction
   * 2. We install a setter on Object.prototype.transform to intercept this assignment
   * 3. When the setter is called:
   *    - `this` = Map instance (has getCanvas, flyTo, etc.)
   *    - `value` = Transform instance (has setZoom, etc.)
   * 4. We verify both conditions and capture the Map instance
   * 5. Clean up the hook to prevent side effects
   *
   * This works regardless of bundling, minification, or global variable exposure.
   */
  (function setupMapLibreInterceptor() {
    console.log('🔧 [MAIN][TRANSFORM_HOOK] Setting up Object.prototype.transform interceptor...');

    let hooked = false;

    Object.defineProperty(Object.prototype, 'transform', {
      configurable: true,
      enumerable: false,
      set: function (value) {
        // Check if this is MapLibre GL Map instance being initialized
        // Conditions:
        // 1. value.setZoom exists (Transform object)
        // 2. this.getCanvas exists (Map instance)
        if (!hooked &&
          value &&
          typeof value.setZoom === 'function' &&
          typeof this.getCanvas === 'function') {

          hooked = true;
          const mapInstance = this;

          console.log('🎯 [MAIN][TRANSFORM_HOOK] MapLibre GL Map instance captured! Version:', mapInstance.version || 'unknown');

          // Store globally for easy access
          window.mmmap = mapInstance;

          // Notify ISOLATED world that map is ready
          sendToIsolated('MAP_READY', {
            version: mapInstance.version || 'unknown',
            timestamp: Date.now()
          });

          // Cleanup: remove the hook to prevent side effects on other objects
          delete Object.prototype.transform;

          // Set the property on the actual Map instance now that the hook is gone
          this.transform = value;

          return;
        }

        // For all other objects (or if already hooked), set the property normally
        Object.defineProperty(this, 'transform', {
          value: value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    });

    console.log('✅ [MAIN][TRANSFORM_HOOK] Hook installed, waiting for MapLibre GL Map...');
  })();

  /**
   * Handle flyTo request from ISOLATED world
   * @param {Object} data - FlyTo parameters
   * @param {number} data.lat - Latitude
   * @param {number} data.lng - Longitude
   * @param {number} [data.zoom=13.62] - Zoom level
   */
  function handleFlyTo(data) {
    const { lat, lng, zoom = 13.62 } = data;

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('❌ [MAIN] Invalid coordinates:', { lat, lng });
      sendToIsolated('FLY_TO_ERROR', {
        error: 'Invalid coordinates',
        lat,
        lng
      });
      return;
    }

    // Check if map is ready
    if (!window.mmmap || typeof window.mmmap.flyTo !== 'function') {
      console.error('❌ [MAIN] Map not ready for flyTo');
      sendToIsolated('FLY_TO_ERROR', {
        error: 'Map not ready',
        isMapDefined: !!window.mmmap,
        hasFlyTo: !!(window.mmmap && typeof window.mmmap.flyTo === 'function')
      });
      return;
    }

    try {
      // Execute flyTo
      window.mmmap.flyTo({
        center: [lng, lat], // MapLibre uses [lng, lat] order
        zoom: zoom
      });

      // Notify success
      sendToIsolated('FLY_TO_SUCCESS', { lat, lng, zoom });

    } catch (error) {
      console.error('❌ [MAIN] FlyTo failed:', error);
      sendToIsolated('FLY_TO_ERROR', {
        error: error.message,
        lat,
        lng,
        zoom
      });
    }
  }

  // ===== fetch 인터셉터 설치 =====

  // 원본 fetch 저장 (페이지가 덮어쓰기 전에 즉시 저장)
  const originalFetch = window.fetch;

  // 원본 fetch가 없으면 종료
  if (typeof originalFetch !== 'function') {
    console.error('❌ [MAIN] window.fetch is not available!');
    return;
  }

  // fetch 오버라이드
  window.fetch = async function (...args) {
    // URL 추출
    const url = (args[0] instanceof Request) ? args[0].url : args[0];
    const method = args[1]?.method || 'GET';

    // 엔드포인트 추출
    const endpoint = extractEndpoint(url);

    // 원본 fetch 실행
    let response;
    try {
      response = await originalFetch.apply(this, args);
    } catch (error) {
      console.error('❌ [MAIN] Fetch failed:', error);
      throw error; // 에러를 페이지에 전달
    }

    // 응답 복제 (원본 손상 방지)
    const clonedResponse = response.clone();

    // Content-Type 확인
    const contentType = clonedResponse.headers.get('content-type') || '';

    // ===== JSON 응답 처리 =====
    if (contentType.includes('application/json')) {
      try {
        const jsonData = await clonedResponse.json();

        // 엔드포인트별 처리
        switch (endpoint) {
          case 'me':
            // 사용자 정보 API
            // 로그인 상태 확인
            if (jsonData.status && jsonData.status.toString()[0] !== '2') {
              console.warn('⚠️ [MAIN] User not logged in (non-2xx status)');
              sendToIsolated('USER_NOT_LOGGED_IN', {
                status: jsonData.status
              });
              break;
            }

            // Extract charge data (API returns charges as object)
            const chargesData = jsonData.charges || {};
            const isChargesObject = typeof chargesData === 'object' && chargesData !== null && !Array.isArray(chargesData);

            const currentCharges = isChargesObject ? chargesData.count : (chargesData || 0);
            const maxCharges = isChargesObject ? chargesData.max : (jsonData.maxCharges || 1);
            const cooldownMs = isChargesObject ? chargesData.cooldownMs : (jsonData.cooldownMs || null);

            // Calculate nextChargeTime if not provided
            // nextChargeTime = now + time until next charge
            let nextChargeTime = jsonData.nextChargeTime;
            if (!nextChargeTime && cooldownMs && currentCharges < maxCharges) {
              // Calculate partial charge progress
              const chargesNeeded = 1; // Time until next single charge
              const fullCharges = Math.floor(currentCharges);
              const partialCharge = currentCharges - fullCharges;
              const timeUntilNextMs = cooldownMs * (1 - partialCharge);
              nextChargeTime = new Date(Date.now() + timeUntilNextMs).toISOString();
            }

            sendToIsolated('USER_INFO', {
              id: jsonData.id,
              name: jsonData.name,
              level: jsonData.level,
              pixelsPainted: jsonData.pixelsPainted,
              droplets: jsonData.droplets,
              charges: currentCharges,
              maxCharges: maxCharges,
              nextChargeTime: nextChargeTime,
              cooldownMs: cooldownMs,
              canPaint: jsonData.canPaint ?? (currentCharges >= 1)
            });
            break;

          case 'pixel':
            // 픽셀 데이터 API
            try {
              const urlObj = new URL(url);
              const x = urlObj.searchParams.get('x');
              const y = urlObj.searchParams.get('y');

              // 타일 좌표 추출
              const pathParts = urlObj.pathname.split('/').filter(s => s && !isNaN(Number(s)));
              const tileX = pathParts[0];
              const tileY = pathParts[1];

              sendToIsolated('PIXEL_DATA', {
                tileX: parseInt(tileX, 10),
                tileY: parseInt(tileY, 10),
                pixelX: parseInt(x, 10),
                pixelY: parseInt(y, 10),
                url: url
              });
            } catch (error) {
              console.error('❌ [MAIN] Failed to parse pixel data:', error);
            }
            break;

          default:
            // 기타 JSON 응답
            break;
        }

      } catch (error) {
        console.error('❌ [MAIN] Failed to parse JSON:', error);
      }
    }

    // ===== 이미지 응답 처리 =====
    else if (contentType.includes('image/')) {
      // 타일 이미지인지 확인
      // 스크린샷용 raw 요청(?raw=true)은 인터셉트하지 않음
      if (url.includes('/tiles/') && !url.includes('?raw=true')) {
        // URL에서 타일 좌표 추출
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // "tiles" 이후의 숫자 부분 찾기
        const tilesIndex = pathParts.indexOf('tiles');
        let tileX, tileY;

        if (tilesIndex !== -1) {
          // Detect Tile Server Base URL
          // e.g. https://wplace.live/api/files/s0/tiles
          const baseUrl = url.substring(0, url.indexOf('/tiles/') + 6); // include '/tiles'

          // Send base URL to ISOLATED world (only once or periodically, handled by receiver)
          sendToIsolated('TILE_SERVER_DETECTED', {
            url: baseUrl
          });

          if (pathParts.length > tilesIndex + 2) {
            // Format: .../tiles/[x]/[y].png (no zoom level)
            tileX = parseInt(pathParts[tilesIndex + 1], 10);
            tileY = parseInt(pathParts[tilesIndex + 2].split('.')[0], 10); // Remove .png
          }
        }

        console.log(`🔍 [MAIN] Parsed tile URL: ${url} -> tileX=${tileX}, tileY=${tileY}`);

        // Return Promise that resolves with processed blob
        return new Promise((resolve, reject) => {
          const blobID = crypto.randomUUID();

          // Store Promise resolver in queue
          tileBlobQueue.set(blobID, {
            resolve: (processedBlob) => {
              // Create new Response with processed blob
              resolve(new Response(processedBlob, {
                headers: clonedResponse.headers,
                status: clonedResponse.status,
                statusText: clonedResponse.statusText
              }));
            },
            reject
          });

          // Get original blob and send to Vue app for processing
          clonedResponse.blob()
            .then(blob => {
              console.log(`📤 [MAIN] Sending tile ${blobID} for processing (${tileX},${tileY})`);

              window.postMessage({
                source: MESSAGE_SOURCE,
                type: 'TILE_RENDER_REQUEST',
                blobID,
                tileX,
                tileY,
                blob,
                url
              }, '*');
            })
            .catch(error => {
              console.error('❌ [MAIN] Failed to read blob:', error);
              tileBlobQueue.delete(blobID);
              reject(error);
            });

          // Timeout after 10 seconds
          setTimeout(() => {
            if (tileBlobQueue.has(blobID)) {
              console.warn(`⚠️ [MAIN] Timeout processing tile ${blobID}, returning original`);
              tileBlobQueue.delete(blobID);
              resolve(response);
            }
          }, 10000);
        });
      }
    }

    // 원본 응답 반환 (Wplace.live는 정상 작동)
    return response;
  };

  // NOTE: fetch를 읽기 전용으로 잠그지 않음
  // Wplace.live도 fetch를 오버라이드할 수 있어야 함
  // document_start로 먼저 실행되므로 우리가 먼저 오버라이드하면 충분함

  console.log('✅ [MAIN] API Interceptor installed successfully');
  console.log('🎯 [MAIN] Fetch override active - ready to intercept API calls');

  // 초기화 완료 알림
  sendToIsolated('INTERCEPTOR_READY', {
    extensionName: EXTENSION_NAME,
    timestamp: Date.now()
  });
});
