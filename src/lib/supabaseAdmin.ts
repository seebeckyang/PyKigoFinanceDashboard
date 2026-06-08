// ───────────────────────────────────────────────────────────────────────────
//  Supabase Admin Client（server only — 絕對不可以在前端 import）
//
//  使用 service_role / secret key,擁有完整 DB 權限,可以:
//   - 跑 DDL(CREATE TABLE, ALTER TABLE...)
//   - 繞過 RLS 直接讀寫
//   - 執行 schema migration
//
//  ⚠️ 此 client 只能在 src/app/api/**/route.ts 內使用。
//  ⚠️ 前端 component 不能 import 此檔。
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bmngtlkkumqtnfrlbydh.supabase.co";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_SECRET_KEY && typeof window === "undefined") {
    console.warn("[supabaseAdmin] SUPABASE_SECRET_KEY 未設定,admin client 無法運作");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * 透過 PostgREST 跑任意 SQL(包含 DDL)
 *
 * 需要在 Supabase 內先建一個 exec_sql function — 我們的 init-schema endpoint
 * 第一次跑時會自動嘗試建立此 function。
 */
export async function execSql(sql: string): Promise<{ ok: boolean; error?: string; data?: any }> {
    // Supabase REST 沒有直接跑 raw SQL 的 endpoint。
    // 解法:透過已建立的 exec_sql function(我們會在 init-schema 第一次部署時自己建)。
    // 但 exec_sql function 本身也是 DDL,雞生蛋問題 → 改走另一條路:
    //
    // 用 pg-meta endpoint(Supabase 內建,需 service key):
    //   POST {SUPABASE_URL}/pg/query   body: { query: "..." }
    //
    // 此 endpoint 在 Supabase Studio 後台也是用同一個,service key 就有權限。
    const url = `${SUPABASE_URL.replace(/\/$/, "")}/pg/query`;
    const r = await fetch(url, {
        method: "POST",
        headers: {
            apikey: SUPABASE_SECRET_KEY,
            Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
    });
    const text = await r.text();
    if (!r.ok) {
        return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 500)}` };
    }
    try {
        return { ok: true, data: JSON.parse(text) };
    } catch {
        return { ok: true, data: text };
    }
}
