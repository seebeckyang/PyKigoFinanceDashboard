// ───────────────────────────────────────────────────────────────────────────
//  Supabase client（雙模式）
//
//  • 若環境變數 NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY 都存在
//    → 建立真正的 Supabase client，連接正式資料庫（家庭財務戰情室 Alex-Finance）。
//  • 否則（例如純 Demo 預覽）→ 回傳安全的空殼 client，所有查詢鏈皆回傳空結果，
//    避免 @supabase/supabase-js 在沒有設定時於瀏覽器丟錯／白屏。
//
//  本檔同時匯出 isSupabaseConfigured，供資料層判斷要走 Supabase 還是本地 mock。
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// ───────────────────────────────────────────────────────────────────────────
// 直接寫死 Supabase 連線資訊（family finance war-room / project: bmngtlkkumqtnfrlbydh）
// 環境變數仍可覆寫（本地測試用），但正式環境不依賴 Vercel 設定即可運作。
// anon key 是公開金鑰（受 RLS 保護），可安全寫入前端 bundle。
// ───────────────────────────────────────────────────────────────────────────
const HARDCODED_URL = "https://bmngtlkkumqtnfrlbydh.supabase.co";
const HARDCODED_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbmd0bGtrdW1xdG5mcmxieWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTUyNDUsImV4cCI6MjA4ODkzMTI0NX0.tu_RQ7KFjqbjoqQoSSVinyFobcEKO1o1Wfb9CBxElDY";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || HARDCODED_ANON_KEY;

export const isSupabaseConfigured: boolean = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type Result = { data: any; error: any };

// 空殼 client：任意鏈式呼叫都安全回傳空結果（Demo / 未設定時使用）
function makeBuilder(): any {
    const result: Result = { data: null, error: { message: "demo-mode: supabase disabled" } };
    const builder: any = new Proxy(
        {
            then: (resolve: (v: Result) => any) => resolve(result),
        },
        {
            get(target: any, prop: string) {
                if (prop === "then") return target.then;
                return () => builder;
            },
        }
    );
    return builder;
}

const demoClient: any = {
    from: () => makeBuilder(),
    rpc: () => makeBuilder(),
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
    },
    storage: { from: () => makeBuilder() },
};

export const supabase: any = isSupabaseConfigured
    ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
          auth: { persistSession: false, autoRefreshToken: false },
      })
    : demoClient;
