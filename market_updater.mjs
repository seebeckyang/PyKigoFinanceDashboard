// ───────────────────────────────────────────────────────────────────────────
//  market_updater — 每日收盤後更新持股最新報價（GitHub Actions cron 執行）
//
//  流程：
//   1. 從 Supabase `holdings` 表讀出所有股票代號
//   2. 向 Yahoo Finance 抓最新報價（台股自動補 .TW / .TWO，美股直接用代號）
//   3. 把最新價寫回 holdings.latest_price + price_updated_at
//   4. 另外抓 USD/TWD、JPY/TWD、CNY/TWD 匯率，存進 app_settings(key='fx_rates')
//
//  需要的環境變數（GitHub Secrets）：
//   SUPABASE_URL（或 NEXT_PUBLIC_SUPABASE_URL）
//   SUPABASE_ANON_KEY（或 NEXT_PUBLIC_SUPABASE_ANON_KEY）
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Missing Supabase credentials.");
    console.error("請在 GitHub Repo → Settings → Secrets 設定 SUPABASE_URL 與 SUPABASE_ANON_KEY。");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 把專案內的股票代號轉成 Yahoo Finance 可查的 ticker。
// 規則：
//  • 美股 / 英文代號（含字母且非台股格式）→ 直接用，例：AAPL、NVDA、ARKG
//  • 台股 4~6 位數字 → 加 .TW（上市）；查不到再試 .TWO（上櫃）
//  • 帶尾碼的特殊代號（2887g、2891c）→ 去掉非數字尾碼後當台股處理
function toYahooCandidates(symbol) {
    const s = String(symbol).trim();
    // 純數字（可能含尾碼字母）→ 台股
    const m = s.match(/^(\d{3,6})/);
    if (m && /^\d/.test(s)) {
        const num = m[1];
        return [`${num}.TW`, `${num}.TWO`];
    }
    // 其餘視為美股 / 國際代號
    return [s.toUpperCase()];
}

async function fetchYahooPrice(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice;
}

async function fetchPriceWithFallback(symbol) {
    const candidates = toYahooCandidates(symbol);
    for (const c of candidates) {
        try {
            const p = await fetchYahooPrice(c);
            if (p !== undefined && p !== null && !isNaN(p)) return { price: p, yfTicker: c };
        } catch (err) {
            // 試下一個候選
        }
    }
    return null;
}

async function main() {
    console.log("讀取 holdings 表的股票代號 …");
    const { data: holdings, error } = await supabase.from('holdings').select('id,symbol');
    if (error) {
        console.error("讀取 holdings 失敗：", error.message);
        process.exit(1);
    }
    if (!holdings || holdings.length === 0) {
        console.log("holdings 表沒有資料，略過。請先在 Supabase 跑過 seed SQL。");
        return;
    }

    const nowIso = new Date().toISOString();
    let ok = 0, miss = 0;

    for (const h of holdings) {
        const r = await fetchPriceWithFallback(h.symbol);
        if (r) {
            const { error: upErr } = await supabase
                .from('holdings')
                .update({ latest_price: r.price, price_updated_at: nowIso })
                .eq('id', h.id);
            if (upErr) {
                console.error(`更新 ${h.symbol} 失敗：`, upErr.message);
            } else {
                ok++;
                console.log(`✓ ${h.symbol} (${r.yfTicker}) = ${r.price}`);
            }
        } else {
            miss++;
            console.log(`⚠ 找不到 ${h.symbol} 的報價`);
        }
    }

    // 匯率 → app_settings(key='fx_rates')
    console.log("抓取匯率 …");
    try {
        const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const fxData = await fxRes.json();
        const usdTwd = fxData.rates.TWD;
        const usdJpy = fxData.rates.JPY;
        const usdCny = fxData.rates.CNY;
        const fxValue = {
            usd_twd: usdTwd,
            jpy_twd: usdJpy ? usdTwd / usdJpy : null,
            cny_twd: usdCny ? usdTwd / usdCny : null,
            updated_at: nowIso,
        };
        const { error: fxErr } = await supabase
            .from('app_settings')
            .upsert({ key: 'fx_rates', value: fxValue }, { onConflict: 'key' });
        if (fxErr) console.error("寫入匯率失敗：", fxErr.message);
        else console.log(`✓ 匯率 USD/TWD=${usdTwd}`);
    } catch (err) {
        console.error("抓取匯率失敗：", err.message);
    }

    console.log(`完成：成功 ${ok} 檔、找不到 ${miss} 檔。`);
}

main();
