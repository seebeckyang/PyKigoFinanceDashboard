// ─────────────────────────────────────────────────────────────────────────
//  即時匯率 (FX) — 統一換算成 TWD
//
//  • 來源：https://open.er-api.com/v6/latest/TWD （免註冊、CORS 友善、IMF 資料）
//  • 快取：localStorage，1 小時過期。離線時 fallback 到內建備援匯率。
//  • API 設計：用 useFxRates() hook 拿到 { rates, convertToTWD, ready }。
// ─────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState, useCallback } from "react";

export type Currency = "TWD" | "USD" | "CNY" | "EUR" | "JPY" | "HKD";

// 支援的幣別清單（UI 下拉用）
export const SUPPORTED_CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "TWD", label: "新台幣 TWD", symbol: "NT$" },
  { code: "USD", label: "美金 USD", symbol: "US$" },
  { code: "CNY", label: "人民幣 CNY", symbol: "¥" },
  { code: "EUR", label: "歐元 EUR", symbol: "€" },
  { code: "JPY", label: "日圓 JPY", symbol: "¥" },
  { code: "HKD", label: "港幣 HKD", symbol: "HK$" },
];

// 內建備援匯率（1 外幣 = X TWD，2026-06 平均值，網路掛了才會用到）
const FALLBACK_TO_TWD: Record<Currency, number> = {
  TWD: 1,
  USD: 31.5,
  CNY: 4.4,
  EUR: 34.0,
  JPY: 0.21,
  HKD: 4.0,
};

const CACHE_KEY = "fx_rates_to_twd_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 小時

interface FxCache {
  rates: Record<Currency, number>; // 1 外幣 = X TWD
  fetched_at: number;
  source: "live" | "fallback";
}

function readCache(): FxCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache;
    if (Date.now() - parsed.fetched_at > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(c: FxCache) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore quota */
  }
}

async function fetchLiveRates(): Promise<Record<Currency, number>> {
  // open.er-api.com 回傳「1 base 幣 = X 其他幣」
  // 我們用 base=TWD，回傳的 rates 是「1 TWD = X 外幣」，取倒數即得「1 外幣 = X TWD」
  const res = await fetch("https://open.er-api.com/v6/latest/TWD", { cache: "no-store" });
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.rates) throw new Error("FX malformed");
  const out: Record<Currency, number> = { ...FALLBACK_TO_TWD };
  (Object.keys(FALLBACK_TO_TWD) as Currency[]).forEach((cur) => {
    if (cur === "TWD") {
      out.TWD = 1;
      return;
    }
    const r = data.rates[cur];
    if (typeof r === "number" && r > 0) {
      out[cur] = 1 / r;
    }
  });
  return out;
}

/**
 * useFxRates — 統一匯率 hook
 *
 * 回傳：
 *   • rates: { USD: 31.5, CNY: 4.4, ... }  ← 1 外幣折算多少 TWD
 *   • ready: boolean
 *   • source: "live" | "fallback"
 *   • convertToTWD(amount, currency): 任意幣別 → TWD
 */
export function useFxRates() {
  const [state, setState] = useState<FxCache>(() => {
    const cached = readCache();
    if (cached) return cached;
    return { rates: FALLBACK_TO_TWD, fetched_at: 0, source: "fallback" };
  });

  useEffect(() => {
    if (state.fetched_at && Date.now() - state.fetched_at < CACHE_TTL_MS && state.source === "live") {
      return;
    }
    let cancelled = false;
    fetchLiveRates()
      .then((rates) => {
        if (cancelled) return;
        const next: FxCache = { rates, fetched_at: Date.now(), source: "live" };
        writeCache(next);
        setState(next);
      })
      .catch((err) => {
        console.warn("[fx] live fetch failed, using fallback:", err?.message);
      });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const convertToTWD = useCallback(
    (amount: number | string | undefined | null, currency: string | undefined | null): number => {
      const amt = Number(amount) || 0;
      const cur = ((currency || "TWD").toUpperCase()) as Currency;
      const rate = state.rates[cur] ?? FALLBACK_TO_TWD[cur] ?? 1;
      return amt * rate;
    },
    [state.rates]
  );

  return {
    rates: state.rates,
    ready: state.fetched_at > 0,
    source: state.source,
    fetchedAt: state.fetched_at,
    convertToTWD,
  };
}

/**
 * 格式化金額顯示（含幣別符號）
 *   formatMoney(1234.56, "USD") → "US$ 1,234.56"
 *   formatMoney(15000, "TWD")   → "NT$ 15,000"
 */
export function formatMoney(amount: number, currency: Currency | string = "TWD"): string {
  const cur = (currency || "TWD").toUpperCase();
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === cur);
  const symbol = meta?.symbol ?? cur;
  const noDecimals = cur === "TWD" || cur === "JPY";
  const rounded = noDecimals ? Math.round(amount) : Math.round(amount * 100) / 100;
  return `${symbol} ${rounded.toLocaleString(undefined, {
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })}`;
}
