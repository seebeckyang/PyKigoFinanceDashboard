// ───────────────────────────────────────────────────────────────────────────
//  Supabase Admin Client(server only,絕對不可以在 client component import)
//
//  使用 secret key(sb_secret_*) 走 PostgREST 寫入,bypass RLS。
//  Vercel env 應該設定 SUPABASE_SECRET_KEY。
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://bmngtlkkumqtnfrlbydh.supabase.co";

const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

if (!SUPABASE_SECRET_KEY) {
    // 不在 import 時 throw,讓 build 過,只在實際呼叫時報錯
    console.warn("[supabaseAdmin] SUPABASE_SECRET_KEY 未設定,API 將無法寫入 DB");
}

// 用 placeholder 防止 build 時 createClient throw。
// 實際呼叫時會透過 HAS_SECRET 檢查、拿 fallback key 打不上去「會被 Supabase 拒」、本來就是預期行為。
export const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY || "placeholder",
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export const SUPABASE_URL_PUBLIC = SUPABASE_URL;
export const HAS_SECRET = Boolean(SUPABASE_SECRET_KEY);
