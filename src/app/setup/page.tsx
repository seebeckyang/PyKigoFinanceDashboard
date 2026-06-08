"use client";
// /setup — JSON 大法版,1 鍵搞定
import { useEffect, useState } from "react";
import { Check, AlertTriangle, Trash2, RefreshCw, Database } from "lucide-react";

export default function SetupPage() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    async function refresh() {
        setErr(null);
        try {
            const r = await fetch("/api/setup", { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
            setCounts(j.counts || {});
            setReady(!!j.ready);
        } catch (e: any) { setErr(e.message); }
    }
    useEffect(() => { refresh(); }, []);

    async function seed() {
        if (!confirm("匯入真實資產資料?(11 機構 / 15 帳戶 / 26 持股 / 1 基金 / 2 保單 / 15 訂閱)")) return;
        setBusy(true); setMsg(null); setErr(null);
        try {
            const r = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seed" }) });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
            setMsg(`✅ 已匯入: ${Object.entries(j.summary).map(([k, v]) => `${k}=${v}`).join(" / ")}`);
            await refresh();
        } catch (e: any) { setErr(e.message); }
        finally { setBusy(false); }
    }

    async function reset() {
        if (!confirm("⚠️ 確定全部清空? 這會刪除所有機構/帳戶/持股/基金/保單/訂閱(支出資料不受影響)")) return;
        setBusy(true); setMsg(null); setErr(null);
        try {
            const r = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset" }) });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
            setMsg("✅ 已全部清空");
            await refresh();
        } catch (e: any) { setErr(e.message); }
        finally { setBusy(false); }
    }

    const labels: Record<string, string> = {
        institution: "機構", account: "帳戶", holding: "持股",
        fund: "基金", policy: "保單", subscription: "訂閱",
    };
    const total = Object.values(counts).reduce((a, b) => a + (b > 0 ? b : 0), 0);

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white p-6 md:p-10 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">🏠 家庭財務戰情室 — 初始設定</h1>
            <p className="text-gray-400 mb-8">
                JSON 大法已啟用,不需要建表也不用碰 SQL。直接按下方按鈕就好。
            </p>

            {err && <div className="bg-red-900/40 border border-red-700 rounded p-3 mb-4 text-sm">❌ {err}</div>}
            {msg && <div className="bg-green-900/40 border border-green-700 rounded p-3 mb-4 text-sm">{msg}</div>}

            <div className="bg-[#111827] border border-gray-800 rounded-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Database size={18} />資料現況</h2>
                    <button onClick={refresh} disabled={busy} className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">
                        <RefreshCw size={12} /> 更新
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                    {Object.entries(labels).map(([k, label]) => (
                        <div key={k} className="bg-gray-900 rounded px-3 py-2 flex items-center justify-between">
                            <span className="text-gray-400">{label}</span>
                            <span className={`tabular-nums font-medium ${counts[k] > 0 ? "text-green-400" : "text-gray-600"}`}>
                                {counts[k] ?? "—"}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">總計 {total} 筆紀錄</div>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-lg p-5 mb-4">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    {total > 0 ? <Check size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-yellow-400" />}
                    {total > 0 ? "已有資料" : "尚未匯入"}
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                    {total > 0
                        ? "你已經有資料了。如果要重新匯入,先按全部清空,再按一鍵匯入。"
                        : "按下方按鈕,系統會把你的 11 機構 / 15 帳戶 / 26 持股 / 1 基金 / 2 保單 / 15 訂閱 全部建好。"}
                </p>
                <div className="flex gap-3">
                    <button onClick={seed} disabled={busy}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-3 rounded font-medium">
                        {busy ? "處理中⋯" : "🚀 一鍵匯入真實資產"}
                    </button>
                    <button onClick={reset} disabled={busy}
                        className="flex items-center gap-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 px-4 py-3 rounded text-sm">
                        <Trash2 size={14} /> 全部清空
                    </button>
                </div>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-3">下一步</h2>
                <div className="space-y-2 text-sm">
                    <a href="/holdings" className="block bg-gray-800 hover:bg-gray-700 rounded px-3 py-2">
                        → /holdings  家庭資產總覽(每項可 ＋✏️🗑️ ,即時股價自動更新)
                    </a>
                    <a href="/quick-expense" className="block bg-gray-800 hover:bg-gray-700 rounded px-3 py-2">
                        → /quick-expense  自然語言 / 語音快速記帳(6 幣別自動偵測)
                    </a>
                </div>
            </div>

            <div className="mt-6 text-[10px] text-gray-600">
                技術說明:JSON 大法 = 把 institutions/accounts/holdings/funds/policies/subscriptions 6 種資料
                偽裝成 expenses 表的紀錄(用 project_label="asset:&lt;kind&gt;" 區分,結構欄位塞 metadata JSONB),
                不需要任何 CREATE TABLE,直接走 Supabase PostgREST。原 expenses 支出資料不受影響。
            </div>
        </div>
    );
}
