// ───────────────────────────────────────────────────────────────────────────
//  liveData — 正式版資料層
//
//  當 Supabase 已設定（NEXT_PUBLIC_SUPABASE_URL + ANON_KEY 存在）時，從正式
//  資料庫讀取持股 / 帳戶 / 訂閱等資料；否則回傳 null，呼叫端 fall back 到本地
//  REAL_DATA（保留 Demo 能力）。
//
//  注意：本專案為 Next.js 靜態輸出（output: "export"），下列查詢皆在「瀏覽器端」
//  執行，使用 anon key 透過 Supabase REST 讀取（RLS 已開放 anon 讀取）。
// ───────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export { isSupabaseConfigured };

export interface LiveHolding {
    symbol: string;
    name: string;
    shares: number;
    currency: string;
    account: string | null;
    category: string | null;
    value: number | null;
    latest_price: number | null;
    price_updated_at: string | null;
}

export interface LiveAccount {
    institution: string;
    type: string | null;
    name: string;
    subtype: string | null;
    currency: string;
    balance: number;
}

// 讀取持股；未設定或讀取失敗 → null（呼叫端 fallback 到 REAL_DATA）
export async function fetchLiveHoldings(): Promise<LiveHolding[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
        const { data, error } = await supabase
            .from("holdings")
            .select("symbol,name,shares,currency,account,category,value,latest_price,price_updated_at")
            .order("value", { ascending: false });
        if (error || !data || data.length === 0) return null;
        return data as LiveHolding[];
    } catch {
        return null;
    }
}

export async function fetchLiveAccounts(): Promise<LiveAccount[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
        const { data, error } = await supabase
            .from("accounts")
            .select("institution,type,name,subtype,currency,balance")
            .order("sort_order", { ascending: true });
        if (error || !data || data.length === 0) return null;
        return data as LiveAccount[];
    } catch {
        return null;
    }
}

export async function fetchLiveSubscriptions(): Promise<any[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .select("name,fee,currency,cycle,billing_day,next_billing,account,monthly_twd,plan_cancel_flag")
            .order("monthly_twd", { ascending: false });
        if (error || !data || data.length === 0) return null;
        return data;
    } catch {
        return null;
    }
}
