"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface LiveQuote {
    symbol: string;
    price: number | null;
    currency: string;
    changePercent: number;
    error?: string;
}

export interface FxRates {
    base: string;
    rates: Record<string, number>;
    updatedAt: string;
}

interface UseLiveMarketResult {
    quotes: LiveQuote[];
    fx: FxRates | null;
    lastUpdated: Date | null;
    isRefreshing: boolean;
    refresh: () => void;
}

/**
 * useLiveMarket — client-side 即時市場資料輪詢 hook
 *
 * 給定 ticker 列表，每 intervalMs（預設 60 秒）輪詢 /api/quotes 與 /api/fx，
 * 同時提供手動 refresh() 與 lastUpdated 時間戳。
 */
export function useLiveMarket(tickers: string[], intervalMs = 60000): UseLiveMarketResult {
    const [quotes, setQuotes] = useState<LiveQuote[]>([]);
    const [fx, setFx] = useState<FxRates | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 用 ref 保存 tickers 字串，避免陣列 reference 變動造成無限重跑
    const tickerKey = tickers.join(",");
    const tickerKeyRef = useRef(tickerKey);
    tickerKeyRef.current = tickerKey;

    const fetchAll = useCallback(async () => {
        // 靜態 Demo Mode：無後端報價 API，直接跳過即時輪詢（市值改用預計真實值）。
        if (typeof window !== "undefined" && (window as any).__STATIC_DEMO__ !== false) {
            setLastUpdated(new Date());
            return;
        }
        setIsRefreshing(true);
        try {
            const tk = tickerKeyRef.current;
            const [qRes, fxRes] = await Promise.all([
                tk ? fetch(`/api/quotes?tickers=${encodeURIComponent(tk)}`, { cache: "no-store" }) : Promise.resolve(null),
                fetch(`/api/fx`, { cache: "no-store" }),
            ]);

            if (qRes && qRes.ok) {
                const data = await qRes.json();
                setQuotes(data.quotes || []);
            }
            if (fxRes && fxRes.ok) {
                const data = await fxRes.json();
                setFx({ base: data.base, rates: data.rates, updatedAt: data.updatedAt });
            }
            setLastUpdated(new Date());
        } catch (err) {
            console.error("[useLiveMarket] fetch failed", err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        const id = setInterval(fetchAll, intervalMs);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tickerKey, intervalMs]);

    return { quotes, fx, lastUpdated, isRefreshing, refresh: fetchAll };
}

/** 把報價換算成 TWD 的工具：價格 × 該幣別匯率倒數轉換 */
export function toTwd(price: number, currency: string, fx: FxRates | null): number {
    if (!fx || !fx.rates) return price;
    const twdPerUsd = fx.rates.TWD || 31.8;
    const curPerUsd = fx.rates[currency] ?? (currency === "TWD" ? twdPerUsd : 1);
    if (!curPerUsd) return price * twdPerUsd;
    // price 是以 currency 計價 → 先轉 USD（÷ curPerUsd）→ 再轉 TWD（× twdPerUsd）
    return (price / curPerUsd) * twdPerUsd;
}
