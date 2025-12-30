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

  // ===== ISOLATED world로부터 메시지 수신 =====
  window.addEventListener('message', (event) => {
    // 보안: 같은 window에서 온 메시지만 처리
    if (event.source !== window) return;

    const message = event.data;

    // ISOLATED world로부터의 메시지만 처리
    if (message.source !== 'marukyu-marble-isolated') return;

    console.log('📨 [MAIN] Received message from ISOLATED world:', message.type);

    // 향후 확장 가능: ISOLATED → MAIN 메시지 처리
    switch (message.type) {
      case 'INIT_SETTINGS':
        console.log('⚙️ [MAIN] Settings received:', message.data);
        // TODO: MAIN world에서 설정 사용
        break;

      default:
        console.warn('⚠️ [MAIN] Unknown message type:', message.type);
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

  // ===== fetch 인터셉터 설치 =====

  // 원본 fetch 저장 (페이지가 덮어쓰기 전에 즉시 저장)
  const originalFetch = window.fetch;

  // 원본 fetch가 없으면 종료
  if (typeof originalFetch !== 'function') {
    console.error('❌ [MAIN] window.fetch is not available!');
    return;
  }

  // fetch 오버라이드
  window.fetch = async function(...args) {
    // URL 추출
    const url = (args[0] instanceof Request) ? args[0].url : args[0];
    const method = args[1]?.method || 'GET';

    // 엔드포인트 추출
    const endpoint = extractEndpoint(url);

    console.log(`🔍 [MAIN] Fetch intercepted: ${method} ${endpoint}`);

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
            console.log('👤 [MAIN] User info API detected');

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

            console.log('📤 [MAIN] Sending user info to ISOLATED world:', {
              name: jsonData.name,
              level: jsonData.level,
              charges: currentCharges,
              maxCharges: maxCharges,
              cooldownMs: cooldownMs
            });

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
            console.log('🎨 [MAIN] Pixel API detected');

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
            console.log(`📋 [MAIN] JSON response from ${endpoint}`);
        }

      } catch (error) {
        console.error('❌ [MAIN] Failed to parse JSON:', error);
      }
    }

    // ===== 이미지 응답 처리 =====
    else if (contentType.includes('image/')) {
      // 타일 이미지인지 확인
      if (url.includes('/tiles/')) {
        console.log('🗺️ [MAIN] Tile image detected');

        try {
          const blob = await clonedResponse.blob();

          // Blob을 Base64로 변환
          const reader = new FileReader();
          reader.onloadend = () => {
            sendToIsolated('TILE_DATA', {
              url: url,
              blobData: reader.result, // data:image/png;base64,...
              size: blob.size,
              type: blob.type
            });
          };
          reader.onerror = (event) => {
            console.error('❌ [MAIN] Failed to read blob:', event, event?.target?.error);
          };
          reader.readAsDataURL(blob);

        } catch (error) {
          console.error('❌ [MAIN] Failed to process tile image:', error);
        }
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
