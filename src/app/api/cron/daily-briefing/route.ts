// /api/cron/daily-briefing
// 每日 17:00 跑一次:
//   1. 抓所有持股的當日報價 + 變動
//   2. 抓大盤指數(^GSPC / ^IXIC / ^TWII)
//   3. 把家庭資產總值 / 各持股漲跌 / 集中度做成戰情報
//   4. 寫入 daily_snapshots,並把摘要塞進 alerts (level=info)

import { NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type YQuote = { symbol: string; regularMarketPrice?: number; regularMarketChange?: number; regularMarketChangePercent?: number; shortName?: string; currency?: string };

async function yahooQuotes(symbols: string[]): Promise<Record<string, YQuote>> {
    if (symbols.length === 0) return {};
    const r = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`, {
        headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store",
    });
    if (!r.ok) return {};
    const j: any = await r.json();
    const out: Record<string, YQuote> = {};
    for (const q of j?.quoteResponse?.result ?? []) out[q.symbol] = q;
    return out;
}

function toYahoo(sym: string, market?: string): string {
    const m = (market || "").toLowerCase();
    if (m === "tw" || m === "twse") return sym.includes(".") ? sym : `${sym}.TW`;
    if (m === "tpex" || m === "otc") return sym.includes(".") ? sym : `${sym}.TWO`;
    if (m === "hk") return sym.includes(".") ? sym : `${sym}.HK`;
    return sym;
}

// 簡單 fx
async function fxToTwd(): Promise<Record<string, number>> {
    try {
        const r = await fetch("https://open.er-api.com/v6/latest/TWD", { cache: "no-store" });
        const j: any = await r.json();
        const rates = j?.rates || {};
        // er-api 給的是 TWD->其他, 所以反過來
        const m: Record<string, number> = { TWD: 1 };
        for (const k of Object.keys(rates)) if (rates[k] > 0) m[k] = 1 / rates[k];
        return m;
    } catch {
        return { TWD: 1, USD: 32, CNY: 4.5, EUR: 35, JPY: 0.21, HKD: 4.1 };
    }
}

export async function GET() {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });

    // 1) 撈持股 / 帳戶
    const [{ data: holdings }, { data: accounts }, { data: funds }, { data: policies }] = await Promise.all([
        supabaseAdmin.from("holdings").select("*"),
        supabaseAdmin.from("accounts").select("*"),
        supabaseAdmin.from("funds").select("*"),
        supabaseAdmin.from("policies").select("*"),
    ]);

    // 2) 拉行情(持股 + 大盤指數)
    const symbols = (holdings ?? []).map(h => toYahoo(h.symbol, h.market));
    const indexes = ["^GSPC", "^IXIC", "^DJI", "^TWII", "^HSI", "^N225"];
    const quotes = await yahooQuotes(Array.from(new Set([...symbols, ...indexes])));
    const fx = await fxToTwd();
    const toTwd = (n: number, c: string) => n * (fx[c.toUpperCase()] ?? 1);

    // 3) 家庭資產
    let totalTwd = 0;
    const positions: any[] = [];
    for (const h of holdings ?? []) {
        const ys = toYahoo(h.symbol, h.market);
        const q = quotes[ys];
        const price = q?.regularMarketPrice ?? Number(h.market_price) ?? 0;
        const mv = price > 0 && Number(h.shares) > 0 ? Number(h.shares) * price : Number(h.market_value) || 0;
        const twd = toTwd(mv, h.currency);
        totalTwd += twd;
        positions.push({
            symbol: h.symbol,
            name: h.name,
            shares: h.shares,
            price,
            market_value: mv,
            currency: h.currency,
            twd,
            changePct: q?.regularMarketChangePercent,
            classification: h.classification,
        });
    }
    for (const a of accounts ?? []) totalTwd += toTwd(Number(a.balance) || 0, a.currency);
    for (const f of funds ?? []) totalTwd += toTwd(Number(f.market_value) || 0, f.currency);
    for (const p of policies ?? []) totalTwd += toTwd(Number(p.current_value) || 0, p.currency);

    // 4) 排序漲跌
    positions.sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
    const top3 = positions.slice(0, 3);
    const bottom3 = positions.slice(-3).reverse();

    // 5) 大盤
    const market = indexes.map(s => {
        const q = quotes[s];
        return { symbol: s, name: q?.shortName, price: q?.regularMarketPrice, changePct: q?.regularMarketChangePercent };
    }).filter(x => x.price);

    const today = new Date().toISOString().slice(0, 10);

    // 6) 寫 daily_snapshots
    await supabaseAdmin.from("daily_snapshots").upsert({
        snapshot_date: today,
        total_twd: Math.round(totalTwd),
        payload: { positions, market, fx, top3, bottom3 } as any,
    }, { onConflict: "snapshot_date" });

    // 7) 寫戰情摘要到 alerts
    const summary = [
        `📊 ${today} 戰情報`,
        `家庭資產:NT$ ${Math.round(totalTwd).toLocaleString()}`,
        `🏆 漲幅前 3: ${top3.map(p => `${p.symbol} ${p.changePct?.toFixed(2)}%`).join(" / ")}`,
        `📉 跌幅前 3: ${bottom3.map(p => `${p.symbol} ${p.changePct?.toFixed(2)}%`).join(" / ")}`,
        `大盤: ${market.map(m => `${m.symbol} ${m.changePct?.toFixed(2)}%`).join(" / ")}`,
    ].join("\n");

    await supabaseAdmin.from("alerts").upsert({
        kind: "daily_briefing",
        level: "info",
        ref_id: today,
        title: `${today} 戰情報`,
        body: summary,
        status: "active",
        created_at: new Date().toISOString(),
    }, { onConflict: "ref_id,kind" });

    return NextResponse.json({
        ok: true,
        date: today,
        total_twd: Math.round(totalTwd),
        positions_count: positions.length,
        top3,
        bottom3,
        market,
        summary,
    });
}
