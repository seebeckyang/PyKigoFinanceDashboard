"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Check, X, Pencil, Sparkles, Info } from "lucide-react";
import { formatMoney } from "@/lib/fx";

interface ParsedExpense {
    amount: number;
    currency?: string;
    category: string;
    date: string;
    note: string;
    paid_for: string;
}

interface VoiceExpenseProps {
    /** 使用者按下「確認」時呼叫；Demo Mode 下父層可顯示「Demo 模式只預覽」 */
    onConfirm?: (parsed: ParsedExpense) => void;
    isDemo?: boolean;
}

// 取得瀏覽器的 SpeechRecognition（含 webkit 前綴）
function getSpeechRecognition(): any {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceExpense({ onConfirm, isDemo = true }: VoiceExpenseProps) {
    const [open, setOpen] = useState(false);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parsed, setParsed] = useState<ParsedExpense | null>(null);
    const [supported, setSupported] = useState(true);
    const [confirmed, setConfirmed] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        setSupported(!!getSpeechRecognition());
    }, []);

    const startListening = () => {
        const SR = getSpeechRecognition();
        if (!SR) {
            setSupported(false);
            return;
        }
        const recognition = new SR();
        recognition.lang = "zh-TW";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.onresult = (event: any) => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            setTranscript(text);
        };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognitionRef.current = recognition;
        setTranscript("");
        setParsed(null);
        setConfirmed(false);
        setListening(true);
        recognition.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setListening(false);
    };

    const handleParse = async (text: string) => {
        if (!text.trim()) return;
        setParsing(true);
        setParsed(null);
        try {
            const res = await fetch("/api/voice-expense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (data.parsed) setParsed(data.parsed);
        } catch (err) {
            console.error("voice parse failed", err);
        } finally {
            setParsing(false);
        }
    };

    const reset = () => {
        setTranscript("");
        setParsed(null);
        setConfirmed(false);
    };

    return (
        <>
            {/* 觸發按鈕 */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#2E7CF6] to-[#22D3EE] text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-[#2E7CF6]/20 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
            >
                <Mic className="w-4 h-4" /> 🎤 語音記帳
            </button>

            {/* 對話框 */}
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1220]/50 backdrop-blur-sm animate-in fade-in" onClick={() => setOpen(false)}>
                    <div className="bg-[#111A2E] rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-[#E6EDF7] flex items-center gap-2">
                                <Mic className="w-5 h-5 text-blue-600" /> 語音記帳
                            </h3>
                            <button onClick={() => setOpen(false)} className="text-[#5A6B89] hover:text-[#93A4C2]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 不支援 Web Speech API 的 fallback（如部分 iOS Safari） */}
                        {!supported && (
                            <div className="mb-4 flex items-start gap-2 bg-[#F59E0B]/10 border border-amber-200 rounded-xl p-3 text-xs text-[#d4880a]">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>您的瀏覽器不支援語音辨識（iOS Safari 支援度有限）。請直接在下方手動輸入，或改用 iOS 捷徑搭配 Siri 記帳。</span>
                            </div>
                        )}

                        {/* 錄音按鈕 / 狀態 */}
                        {supported && (
                            <div className="flex flex-col items-center gap-3 mb-4">
                                <button
                                    onClick={listening ? stopListening : startListening}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                                        listening ? "bg-[#EF4444] animate-pulse shadow-red-200" : "bg-blue-600 hover:bg-blue-700 shadow-[#2E7CF6]/20"
                                    }`}
                                >
                                    {listening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                                </button>
                                <span className="text-xs text-[#93A4C2]">{listening ? "聆聽中…請說出您的消費，例如「中午吃便當花了 350」" : "點麥克風開始說話"}</span>
                            </div>
                        )}

                        {/* 文字輸入 / 即時轉文字 */}
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="例如：我中午吃便當花了 350"
                            rows={2}
                            className="w-full rounded-xl border border-[#1F2C4A] px-3 py-2 text-sm text-[#E6EDF7] focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        />

                        <button
                            onClick={() => handleParse(transcript)}
                            disabled={!transcript.trim() || parsing}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-[#111A2E] hover:bg-[#0B1220] text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-40"
                        >
                            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {parsing ? "AI 解析中…" : "解析這筆消費"}
                        </button>

                        {/* 解析結果，待使用者確認 */}
                        {parsed && (
                            <div className="mt-4 rounded-2xl border border-[#1F2C4A]/60 bg-[#111A2E]/70 p-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-xs font-bold text-[#93A4C2] mb-2 flex items-center gap-1">
                                    <Pencil className="w-3 h-3" /> 解析結果（請確認）
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <Field label="金額" value={formatMoney(parsed.amount, parsed.currency || "TWD")} />
                                    <Field label="類別" value={parsed.category} />
                                    <Field label="日期" value={parsed.date} />
                                    <Field label="分攤對象" value={parsed.paid_for} />
                                    <div className="col-span-2">
                                        <Field label="備註" value={parsed.note} />
                                    </div>
                                </div>

                                {confirmed ? (
                                    <div className="mt-3 text-center text-sm font-semibold text-[#10B981] flex items-center justify-center gap-1">
                                        <Check className="w-4 h-4" />
                                        {isDemo ? "Demo 模式：僅預覽，未寫入資料庫" : "已加入待審核清單"}
                                    </div>
                                ) : (
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={reset} className="flex-1 py-2 rounded-xl bg-white border border-[#1F2C4A] text-[#93A4C2] text-sm font-medium hover:bg-[#111A2E]">
                                            重新輸入
                                        </button>
                                        <button
                                            onClick={() => {
                                                onConfirm?.(parsed);
                                                setConfirmed(true);
                                            }}
                                            className="flex-1 py-2 rounded-xl bg-[#10B981]/100 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1"
                                        >
                                            <Check className="w-4 h-4" /> 確認
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#111A2E] rounded-lg px-3 py-2 border border-[#1F2C4A]/60">
            <div className="text-[10px] text-[#5A6B89] font-semibold">{label}</div>
            <div className="text-[#E6EDF7] font-medium truncate">{value}</div>
        </div>
    );
}
