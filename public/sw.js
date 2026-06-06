// ───────────────────────────────────────────────────────────
// 家庭財務戰情室 — Minimal Service Worker
// 提供基本的離線殼層快取（app shell），不快取 API 即時資料。
// ───────────────────────────────────────────────────────────

const CACHE_NAME = "kigo-finance-v1";
const PRECACHE_URLS = [
    "/",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
    "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // 只處理 GET
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // 即時資料（報價 / 匯率 / 其他 API）一律走網路，不快取
    if (url.pathname.startsWith("/api/")) {
        return; // 交給瀏覽器預設行為（network）
    }

    // 其餘採 network-first，失敗時回退快取（離線時可看殼層）
    event.respondWith(
        fetch(request)
            .then((response) => {
                // 僅快取同源、成功的回應
                if (response && response.status === 200 && url.origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
                }
                return response;
            })
            .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
});
