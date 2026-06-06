// 靜態 Demo Mode — 不連接 Supabase，提供安全的查詢鏈空殼，
// 避免 @supabase/supabase-js 在預覽 iframe 內存取 localStorage 而導致白屏。
// Demo Mode 下所有 action 皆提早回傳，不會真的呼叫到這裡的查詢方法。

type Result = { data: any; error: any };

function makeBuilder(): any {
    const result: Result = { data: null, error: { message: "demo-mode: supabase disabled" } };
    const builder: any = new Proxy(
        {
            // 讓 await 直接拿到結果
            then: (resolve: (v: Result) => any) => resolve(result),
        },
        {
            get(target: any, prop: string) {
                if (prop === "then") return target.then;
                // 任意鏈式方法皆回傳同一個 builder，最終 await 得到空結果
                return () => builder;
            },
        }
    );
    return builder;
}

export const supabase: any = {
    from: () => makeBuilder(),
    rpc: () => makeBuilder(),
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
    },
    storage: { from: () => makeBuilder() },
};
