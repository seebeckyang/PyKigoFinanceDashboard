"use client";
import { useEffect, useState } from "react";

export type Quote = { price: number; currency: string; change?: number; changePct?: number; name?: string; market?: string; ts: number };

// market 對應到 Yahoo Finance 後綴
function toYahooSymbol(symbol: string, market?: string): string {
    const m = (market || "").toLowerCase();
    if (m === "tw" || m === "twse") return symbol.includes(".") ? symbol : `${symbol}.TW`;
    if (m === "tpex" || m === "otc") return symbol.includes(".") ? symbol : `${symbol}.TWO`;
    if (m === "hk") return symbol.includes(".") ? symbol : `${symbol}.HK`;
    // US:不加後綴
    return symbol;
}

export function useLiveQuotes(symbols: Array<{ symbol: string; market?: string }>): Record<string, Quote> {
    const [quotes, setQuotes] = useState<Record<string, Quote>>({});

    useEffect(() => {
        if (symbols.length === 0) return;
        const yahooList = symbols.map(s => toYahooSymbol(s.symbol, s.market));
        const uniq = Array.from(new Set(yahooList));
        if (uniq.length === 0) return;

        let cancelled = false;
        async function load() {
            try {
                const r = await fetch(`/api/quotes?symbols=${encodeURIComponent(uniq.join(","))}`, { cache: "no-store" });
                if (!r.ok) return;
                const j = await r.json();
                if (cancelled) return;
                // 把 yahoo 後綴版本還原:keying by yahoo symbol
                setQuotes(j as Record<string, Quote>);
            } catch { }
        }
        load();
        const t = setInterval(load, 60_000);
        return () => { cancelled = true; clearInterval(t); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(symbols)]);

    // 提供「以原始 symbol 查詢」的對應表(把 .TW/.TWO/.HK 後綴拆掉)
    const out: Record<string, Quote> = {};
    for (const [k, v] of Object.entries(quotes)) {
        out[k] = v;
        const base = k.split(".")[0];
        if (base && !out[base]) out[base] = v;
    }
    return out;
}

export function yahooSym(symbol: string, market?: string) {
    return toYahooSymbol(symbol, market);
}
