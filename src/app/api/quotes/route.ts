// /api/quotes?symbols=AAPL,NVDA,2330.TW
// 美股走 Yahoo Finance public quote endpoint
// 台股 (XXXX.TW / .TWO) 走 Yahoo Finance(代號自帶後綴)
// 回傳 { [symbol]: { price, currency, market, change, changePct, name } }

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Quote = {
    symbol: string;
    price: number;
    currency: string;
    market: string;
    change?: number;
    changePct?: number;
    name?: string;
    ts: number;
};

async function fetchYahoo(symbols: string[]): Promise<Record<string, Quote>> {
    if (symbols.length === 0) return {};
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
    const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        cache: "no-store",
    });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const j: any = await r.json();
    const out: Record<string, Quote> = {};
    for (const q of j?.quoteResponse?.result ?? []) {
        const sym = q.symbol;
        out[sym] = {
            symbol: sym,
            price: q.regularMarketPrice ?? 0,
            currency: q.currency ?? "USD",
            market: q.fullExchangeName ?? q.exchange ?? "",
            change: q.regularMarketChange,
            changePct: q.regularMarketChangePercent,
            name: q.shortName ?? q.longName,
            ts: Date.now(),
        };
    }
    return out;
}

// 簡單記憶體快取 60 秒,避免雜訊請求
const CACHE: Record<string, { v: Quote; exp: number }> = {};
const TTL = 60_000;

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams.get("symbols");
    if (!sp) return NextResponse.json({ error: "缺少 symbols 參數" }, { status: 400 });
    const raw = sp.split(",").map(s => s.trim()).filter(Boolean);
    if (raw.length === 0) return NextResponse.json({});

    const now = Date.now();
    const need: string[] = [];
    const out: Record<string, Quote> = {};
    for (const s of raw) {
        const c = CACHE[s];
        if (c && c.exp > now) out[s] = c.v;
        else need.push(s);
    }

    if (need.length > 0) {
        try {
            const fresh = await fetchYahoo(need);
            for (const [k, v] of Object.entries(fresh)) {
                CACHE[k] = { v, exp: now + TTL };
                out[k] = v;
            }
        } catch (e: any) {
            return NextResponse.json({ error: e.message, partial: out }, { status: 502 });
        }
    }

    return NextResponse.json(out);
}
