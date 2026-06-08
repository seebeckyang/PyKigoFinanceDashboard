"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

const SUPABASE_PROJECT_REF = "bmngtlkkumqtnfrlbydh";
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`;

type Status = {
    schemaSql: string;
    tablesExist: Record<string, boolean>;
    allReady: boolean;
};

export default function SetupPage() {
    const [status, setStatus] = useState<Status | null>(null);
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [err, setErr] = useState<string | null>(null);

    async function refresh() {
        setErr(null);
        try {
            const r = await fetch("/api/setup", { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
            setStatus(j);
        } catch (e: any) { setErr(e.message); }
    }

    useEffect(() => { refresh(); }, []);

    async function copySql() {
        if (!status) return;
        await navigator.clipboard.writeText(status.schemaSql);
        setLog(l => [...l, "✅ SQL 已複製到剪貼簿"]);
    }

    function openEditor() {
        window.open(SQL_EDITOR_URL, "_blank");
    }

    async function doSeed() {
        setBusy(true); setLog(l => [...l, "▶️ 開始匯入真實資產..."]);
        try {
            const r = await fetch("/api/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "seed" }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || j.step + ": " + j.error);
            setLog(l => [...l, `✅ 匯入完成: ${JSON.stringify(j.summary)}`]);
            await refresh();
        } catch (e: any) {
            setLog(l => [...l, `❌ 匯入失敗: ${e.message}`]);
        } finally { setBusy(false); }
    }

    async function doReset() {
        if (!confirm("確定全部清空所有銀行/帳戶/持股資料?")) return;
        setBusy(true); setLog(l => [...l, "▶️ 開始清空..."]);
        try {
            const r = await fetch("/api/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || JSON.stringify(j.errors));
            setLog(l => [...l, "✅ 全部清空"]);
            await refresh();
        } catch (e: any) {
            setLog(l => [...l, `❌ 清空失敗: ${e.message}`]);
        } finally { setBusy(false); }
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white p-6 md:p-10 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">家庭財務戰情室 — 初始設定</h1>
            <p className="text-gray-400 text-sm mb-8">
                第一次設定:照下面三步走完,以後新增 / 刪減 / 修改全部在 /holdings 頁面 UI 上做,不會再碰到 SQL。
            </p>

            {err && (
                <div className="bg-red-900/40 border border-red-700 rounded p-3 mb-6 text-sm">
                    {err}
                </div>
            )}

            {status && (
                <>
                    {/* Step 1: schema */}
                    <section className="bg-[#111827] border border-gray-800 rounded-lg p-5 mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">
                                Step 1 · 建立資料表
                                {" "}
                                {status.allReady ? <span className="text-green-400 text-sm ml-2">✅ 已建立</span>
                                    : <span className="text-yellow-400 text-sm ml-2">⏳ 需要建立</span>}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
                            {Object.entries(status.tablesExist).map(([t, ok]) => (
                                <div key={t} className={`px-2 py-1 rounded ${ok ? "bg-green-900/30 text-green-300" : "bg-gray-800 text-gray-400"}`}>
                                    {ok ? "✓" : "✗"} {t}
                                </div>
                            ))}
                        </div>

                        {!status.allReady && (
                            <>
                                <p className="text-sm text-gray-400 mb-3">
                                    Supabase 限制:第一次 schema 必須手動跑一次 SQL。之後永遠不用再碰。
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={copySql} disabled={busy}
                                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium">
                                        📋 複製 schema SQL
                                    </button>
                                    <button onClick={openEditor}
                                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium">
                                        🔗 開啟 Supabase SQL Editor
                                    </button>
                                    <button onClick={refresh}
                                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium">
                                        🔄 已跑完,檢查
                                    </button>
                                </div>
                            </>
                        )}
                    </section>

                    {/* Step 2: seed */}
                    <section className={`bg-[#111827] border border-gray-800 rounded-lg p-5 mb-5 ${!status.allReady ? "opacity-50" : ""}`}>
                        <h2 className="text-lg font-semibold mb-3">Step 2 · 匯入真實資產</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            匯入 11 家機構 / 15 帳戶 / 26 持股 / 1 基金 / 2 保單 / 15 訂閱(從你截圖整理)。
                            匯入後可以在 /holdings 頁面隨時改、加、刪。
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={doSeed} disabled={busy || !status.allReady}
                                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 px-4 py-2 rounded text-sm font-medium">
                                🚀 一鍵匯入真實資產
                            </button>
                            <button onClick={doReset} disabled={busy || !status.allReady}
                                className="bg-red-700 hover:bg-red-600 disabled:bg-gray-700 px-4 py-2 rounded text-sm font-medium">
                                🗑️ 全部清空
                            </button>
                        </div>
                    </section>

                    {/* Step 3: 前往 */}
                    <section className={`bg-[#111827] border border-gray-800 rounded-lg p-5 mb-5 ${!status.allReady ? "opacity-50" : ""}`}>
                        <h2 className="text-lg font-semibold mb-3">Step 3 · 前往戰情室</h2>
                        <div className="flex gap-2 flex-wrap">
                            <a href="/holdings" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-sm font-medium">
                                💼 資產總覽 /holdings
                            </a>
                            <a href="/expenses" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium">
                                💸 支出記帳 /expenses
                            </a>
                            <a href="/subscriptions" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium">
                                🔁 訂閱管理 /subscriptions
                            </a>
                        </div>
                    </section>
                </>
            )}

            {/* Log */}
            {log.length > 0 && (
                <section className="bg-black/40 border border-gray-800 rounded-lg p-4 font-mono text-xs">
                    {log.map((l, i) => <div key={i} className="py-0.5">{l}</div>)}
                </section>
            )}
        </div>
    );
}
