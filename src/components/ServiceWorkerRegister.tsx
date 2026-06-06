"use client";

import { useEffect } from "react";

/** 在背景註冊 minimal service worker（僅在 production / 支援的瀏覽器） */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;
        // 部署於 iframe 預覽時可能不支援，包在 try/catch 確保不崩潰
        try {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.warn("[SW] registration skipped:", err?.message);
            });
        } catch (err) {
            console.warn("[SW] registration error:", err);
        }
    }, []);

    return null;
}
