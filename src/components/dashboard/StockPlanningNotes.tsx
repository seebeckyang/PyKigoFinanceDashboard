"use client";

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Info } from 'lucide-react';
import { saveStrategyNote, getStrategyNotes } from '@/app/actions/planning';

interface StockPlanningNotesProps {
    symbol: string;
}

export default function StockPlanningNotes({ symbol }: StockPlanningNotesProps) {
    const [notes, setNotes] = useState("");
    const [buyPrice, setBuyPrice] = useState<number | "">("");
    const [sellPrice, setSellPrice] = useState<number | "">("");
    const [confidence, setConfidence] = useState(3);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await getStrategyNotes(symbol);
            if (data) {
                setNotes(data.note_content || "");
                setBuyPrice(data.target_buy_price || "");
                setSellPrice(data.target_sell_price || "");
                setConfidence(data.confidence_level || 3);
            } else {
                // Reset if not found
                setNotes("");
                setBuyPrice("");
                setSellPrice("");
                setConfidence(3);
            }
        };
        load();
    }, [symbol]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await saveStrategyNote(symbol, {
                note_content: notes,
                target_buy_price: buyPrice === "" ? null : Number(buyPrice),
                target_sell_price: sellPrice === "" ? null : Number(sellPrice),
                confidence_level: confidence
            });
            setMessage({ type: 'success', text: '策略已儲存' });
        } catch (e) {
            setMessage({ type: 'error', text: '儲存失敗，請檢查資料庫連線' });
        }
        setSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#5A6B89] border-l-4 border-[#2E7CF6] pl-3 uppercase tracking-wider">
                    交易策略 (Trading Strategy)
                </h3>
                {message && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${message.type === 'success' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-red-100 text-[#EF4444]'}`}>
                        {message.text}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#5A6B89] uppercase">目標買入價</label>
                    <input
                        type="number"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-[#16223D]/300 border border-[#1F2C4A] rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#2E7CF6] outline-none transition-all"
                        placeholder="$ 0.00"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#5A6B89] uppercase">目標賣出價</label>
                    <input
                        type="number"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-[#16223D]/300 border border-[#1F2C4A] rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#2E7CF6] outline-none transition-all"
                        placeholder="$ 0.00"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-[#5A6B89] uppercase">持股信心 (1-5)</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <button
                            key={level}
                            onClick={() => setConfidence(level)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${confidence === level
                                ? 'bg-[#111A2E] border-[#2E7CF6] text-white shadow-lg shadow-[#2E7CF6]/15'
                                : 'bg-[#16223D]/300 border-[#1F2C4A] text-[#5A6B89] hover:border-[#2a3d60]'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-[#5A6B89] uppercase">戰術筆記 (Notes)</label>
                <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#16223D]/300 border border-[#1F2C4A] rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#2E7CF6] outline-none transition-all resize-none"
                    placeholder="紀錄買賣邏輯、標的觀察或是止損計畫..."
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#111A2E] hover:bg-[#0B1220] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
                {saving ? "儲存中..." : (
                    <>
                        <Save className="w-4 h-4" />
                        儲存策略變更
                    </>
                )}
            </button>

            <div className="p-3 bg-[#111A2E] border border-[#1F2C4A] rounded-lg flex gap-3 text-[#1a6ae3]">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-[10px] leading-relaxed">
                    筆記將與代號關連，即使在此頁面切換不同標的，系統也會自動帶入您先前儲存的對應策略。
                </p>
            </div>
        </div>
    );
}
