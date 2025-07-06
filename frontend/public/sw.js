/* sw.js  – register at scope “/” */

const COOP = 'Cross-Origin-Opener-Policy';
const COEP = 'Cross-Origin-Embedder-Policy';
const COOP_V = 'same-origin'; // or "same-origin-allow-popups"
const COEP_V = 'require-corp'; // or "credentialless"

self.addEventListener('install', (evt) => self.skipWaiting());
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (evt) => {
  // Only rewrite *top-level* navigations; let sub-resources through untouched
  if (evt.request.mode !== 'navigate') return;

  evt.respondWith(
    (async () => {
      const netRes = await fetch(evt.request, { credentials: 'same-origin' });

      // Clone body because a response can be read only once
      const body = await netRes.blob();

      const headers = new Headers(netRes.headers);
      headers.set(COOP, COOP_V);
      headers.set(COEP, COEP_V);

      return new Response(body, {
        status: netRes.status,
        statusText: netRes.statusText,
        headers,
      });
    })(),
  );
});
