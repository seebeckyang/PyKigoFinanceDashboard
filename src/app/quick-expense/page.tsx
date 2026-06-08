"use client";
// 自然語言 + 語音記帳
// 範例: 「昨天在星巴克花了 NT$ 195」「Uber 美金 22.5」「7-11 早餐 95」

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Check, X } from "lucide-react";

type ParsedItem = {
    merchant?: string;
    amount?: number;
    currency?: string;
    category?: string;
    note?: string;
    occurred_at?: string;
    raw: string;
    confidence: number;
};

export default function QuickExpensePage() {
    const [text, setText] = useState("");
    const [items, setItems] = useState<ParsedItem[]>([]);
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
    const [err, setErr] = useState<string | null>(null);
    const recogRef = useRef<any>(null);

    useEffect(() => {
        // @ts-ignore
        const SR = typeof window !== "undefined" ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
        if (SR) {
            const r = new SR();
            r.lang = "zh-TW";
            r.continuous = false;
            r.interimResults = false;
            r.onresult = (e: any) => {
                const t = e.results[0][0].transcript;
                setText(prev => prev ? `${prev}\n${t}` : t);
            };
            r.onend = () => setListening(false);
            r.onerror = (e: any) => { setErr(`語音錯誤: ${e.error}`); setListening(false); };
            recogRef.current = r;
        }
    }, []);

    function toggleListen() {
        setErr(null);
        if (!recogRef.current) { setErr("瀏覽器不支援語音輸入,請改用文字"); return; }
        if (listening) { recogRef.current.stop(); setListening(false); }
        else { recogRef.current.start(); setListening(true); }
    }

    async function parse() {
        if (!text.trim()) return;
        setBusy(true); setErr(null);
        try {
            const r = await fetch("/api/ai-expense-parse", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
            setItems(j.items ?? []);
        } catch (e: any) { setErr(e.message); }
        finally { setBusy(false); }
    }

    function updateItem(i: number, patch: Partial<ParsedItem>) {
        setItems(items => items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    }
    function removeItem(i: number) {
        setItems(items => items.filter((_, idx) => idx !== i));
    }

    async function saveAll() {
        setBusy(true); setErr(null);
        let ok = 0;
        for (const it of items) {
            if (!it.amount) continue;
            try {
                const r = await fetch("/api/expenses", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        merchant: it.merchant,
                        amount: it.amount,
                        currency: it.currency || "TWD",
                        category: it.category,
                        note: it.note,
                        occurred_at: it.occurred_at,
                    }),
                });
                if (r.ok) ok++;
            } catch { }
        }
        setSavedCount(ok);
        setItems([]); setText("");
        setBusy(false);
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white p-4 md:p-8 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">⚡ 快速記帳</h1>
            <p className="text-gray-400 text-sm mb-6">
                直接打字或用語音,例如:「昨天星巴克 NT$ 195」「Uber 美金 22.5」「7-11 早餐 95」
            </p>

            {err && <div className="bg-red-900/40 border border-red-700 rounded p-3 mb-4 text-sm">{err}</div>}
            {savedCount > 0 && (
                <div className="bg-green-900/40 border border-green-700 rounded p-3 mb-4 text-sm">
                    ✅ 已儲存 {savedCount} 筆
                </div>
            )}

            <div className="bg-[#111827] border border-gray-800 rounded-lg p-4 mb-4">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={4}
                    placeholder="輸入或語音記帳⋯"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-between mt-3">
                    <button onClick={toggleListen}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${listening ? "bg-red-700 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}>
                        {listening ? <MicOff size={14} /> : <Mic size={14} />}
                        {listening ? "停止" : "語音"}
                    </button>
                    <button onClick={parse} disabled={busy || !text.trim()}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-1.5 rounded text-sm">
                        <Send size={14} /> 解析
                    </button>
                </div>
            </div>

            {items.length > 0 && (
                <div className="bg-[#111827] border border-gray-800 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-400 mb-3">解析結果 ({items.length} 筆) — 可調整後儲存</div>
                    <div className="space-y-2">
                        {items.map((it, i) => (
                            <div key={i} className="bg-gray-900 rounded p-3 grid grid-cols-12 gap-2 text-sm items-center">
                                <input value={it.merchant ?? ""} onChange={e => updateItem(i, { merchant: e.target.value })}
                                    placeholder="商家" className="col-span-3 bg-black/40 border border-gray-700 rounded px-2 py-1" />
                                <input type="number" value={it.amount ?? ""} onChange={e => updateItem(i, { amount: Number(e.target.value) })}
                                    placeholder="金額" className="col-span-2 bg-black/40 border border-gray-700 rounded px-2 py-1 tabular-nums" />
                                <select value={it.currency ?? "TWD"} onChange={e => updateItem(i, { currency: e.target.value })}
                                    className="col-span-2 bg-black/40 border border-gray-700 rounded px-2 py-1">
                                    {["TWD", "USD", "CNY", "EUR", "JPY", "HKD"].map(c => <option key={c}>{c}</option>)}
                                </select>
                                <input value={it.category ?? ""} onChange={e => updateItem(i, { category: e.target.value })}
                                    placeholder="分類" className="col-span-2 bg-black/40 border border-gray-700 rounded px-2 py-1" />
                                <input type="date" value={it.occurred_at ?? ""} onChange={e => updateItem(i, { occurred_at: e.target.value })}
                                    className="col-span-2 bg-black/40 border border-gray-700 rounded px-2 py-1 text-xs" />
                                <button onClick={() => removeItem(i)} className="col-span-1 text-gray-500 hover:text-red-400">
                                    <X size={14} />
                                </button>
                                <div className="col-span-12 text-[10px] text-gray-500">原文:{it.raw} · 信心 {(it.confidence * 100).toFixed(0)}%</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={saveAll} disabled={busy}
                        className="mt-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 px-4 py-2 rounded text-sm font-medium flex items-center justify-center gap-1">
                        <Check size={14} /> 全部儲存到 /expenses
                    </button>
                </div>
            )}

            <div className="text-xs text-gray-500">
                💡 支援 6 種幣別自動偵測:NT$/TWD、US$/USD、¥/CNY、€/EUR、JPY、HKD
            </div>
        </div>
    );
}
