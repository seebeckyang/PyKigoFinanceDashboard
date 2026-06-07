"use client";

import React, { useState, useEffect, memo } from 'react';
import {
    Sparkles,
    Receipt,
    AlertTriangle,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Expense, ExpenseCategory } from "@/types/expenses";
import { getSuggestedCategoryId } from "./utils";
import { useFxRates, formatMoneyWithTWD } from "@/lib/fx";

interface ReviewItemProps {
    item: Expense;
    onConfirm: (id: string, updates: any) => void;
    onDelete: (id: string) => void;
    onUpdate?: (id: string, updates: any) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    categories: ExpenseCategory[];
    goals: any[];
    batchSettings: any;
}

// 金額顯示子元件（原幣 + TWD 折算）
function ReviewItemAmount({ amount, currency }: { amount: number; currency: string }) {
    const { convertToTWD } = useFxRates();
    const m = formatMoneyWithTWD(amount, currency, convertToTWD);
    return (
        <div className="flex flex-col items-start xl:items-center">
            <div className="font-black text-2xl text-[#E6EDF7] tracking-tighter">{m.primary}</div>
            {m.secondary && <div className="text-[10px] font-bold text-[#5A6B89] mt-0.5">{m.secondary}</div>}
        </div>
    );
}

export const ReviewItem = memo(function ReviewItem({
    item,
    onConfirm,
    onDelete,
    onUpdate,
    isSelected,
    onToggleSelect,
    categories,
    goals,
    batchSettings
}: ReviewItemProps) {
    const [updates, setUpdates] = useState({
        goal_id: item.goal_id || '',
        category_id: item.category_id || getSuggestedCategoryId(item.store_name, categories),
        paid_by: item.paid_by || (batchSettings?.paid_by || 'CY'),
        paid_for: item.paid_for || (batchSettings?.paid_for || 'Both')
    });

    useEffect(() => {
        if (batchSettings) {
            const next = {
                ...updates,
                paid_by: batchSettings.paid_by,
                paid_for: batchSettings.paid_for
            };
            // Only update if actually different to prevent infinite loops
            if (next.paid_by !== updates.paid_by || next.paid_for !== updates.paid_for) {
                setUpdates(next);
                onUpdate?.(item.id, next);
            }
        }
    }, [batchSettings, item.id, onUpdate, updates]);

    // Initial report is now handled by AIInbox initializing its state

    return (
        <div className={cn(
            "bg-[#111A2E]/80 backdrop-blur-md border rounded-[2rem] p-4 flex flex-col xl:grid xl:grid-cols-12 xl:items-center gap-4 transition-all duration-500",
            isSelected ? "border-[#F59E0B] bg-[#F59E0B]/10/50 ring-4 ring-amber-100/20 shadow-2xl shadow-amber-200/20" : "border-[#1F2C4A]/60 hover:border-[#2E7CF6]/30 shadow-sm"
        )}>
            <div className="flex items-center gap-4 xl:col-span-4 min-w-0">
                <div className="flex-shrink-0">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-6 h-6 rounded-xl border-[#1F2C4A] text-[#F59E0B] focus:ring-amber-500 cursor-pointer transition-all hover:scale-110"
                    />
                </div>
                <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-[#111A2E] items-center justify-center border border-[#1F2C4A]/60 flex-shrink-0 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {item.is_automated ? <Sparkles className="w-5 h-5 text-[#F59E0B] animate-pulse relative z-10" /> : <Receipt className="w-5 h-5 text-[#5A6B89] relative z-10" />}
                </div>
                <div className="min-w-0">
                    <div className="font-black text-[#E6EDF7] text-lg tracking-tighter flex items-center gap-2">
                        <span className="truncate">{item.store_name}</span>
                        {item.is_duplicate && (
                            <span
                                className="flex-shrink-0 flex items-center gap-1 bg-rose-50 text-rose-600 text-[8px] px-2 py-0.5 rounded-full border border-rose-100 font-black uppercase tracking-widest"
                                title={item.metadata?.duplicate_of_id ? `與現有記錄匹配 (#${item.metadata.duplicate_of_id.substring(0, 6)})` : "偵測到疑似重複的現有支出"}
                            >
                                <AlertTriangle className="w-2 h-2" /> DUP
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] font-black text-[#5A6B89] mt-0.5 flex items-center gap-2 uppercase tracking-widest truncate">
                        <span>{item.date}</span>
                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                        <span className={cn(item.is_automated ? "text-[#F59E0B]" : "text-[#5A6B89]")}>
                            {item.is_automated ? 'Smart Import' : 'Manual Entry'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="xl:col-span-2 text-left xl:text-center">
                <ReviewItemAmount amount={item.amount} currency={(item as any).currency || "TWD"} />
            </div>

            <div className="xl:col-span-5 grid grid-cols-2 gap-x-10 gap-y-3 bg-[#111A2E]/50 px-6 py-4 rounded-[2rem] border border-[#1F2C4A]/60">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#5A6B89] uppercase tracking-widest mb-0.5">Project</span>
                    <select
                        value={updates.goal_id}
                        onChange={(e) => {
                            const next = { ...updates, goal_id: e.target.value };
                            setUpdates(next);
                            onUpdate?.(item.id, next);
                        }}
                        className="bg-transparent text-[13px] font-black text-[#2E7CF6] outline-none cursor-pointer max-w-[150px] truncate"
                    >
                        <option value="">🏠 HOME</option>
                        {goals.map((g: any) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col border-l border-[#1F2C4A]/60 pl-8">
                    <span className="text-[9px] font-black text-[#5A6B89] uppercase tracking-widest mb-0.5">Paid By</span>
                    <select
                        value={updates.paid_by}
                        onChange={(e) => {
                            const next = { ...updates, paid_by: e.target.value };
                            setUpdates(next);
                            onUpdate?.(item.id, next);
                        }}
                        className="bg-transparent text-[13px] font-black text-[#10B981] outline-none cursor-pointer"
                    >
                        <option value="CY">CY</option>
                        <option value="HY">HY</option>
                        <option value="Both">Both</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#5A6B89] uppercase tracking-widest mb-0.5">Category</span>
                    <select
                        value={updates.category_id}
                        onChange={(e) => {
                            const next = { ...updates, category_id: e.target.value };
                            setUpdates(next);
                            onUpdate?.(item.id, next);
                        }}
                        className="bg-transparent text-[13px] font-black text-[#93A4C2] outline-none cursor-pointer max-w-[150px] truncate"
                    >
                        <option value="">UNCATEGORIZED</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="flex flex-col border-l border-[#1F2C4A]/60 pl-8">
                    <span className="text-[9px] font-black text-[#5A6B89] uppercase tracking-widest mb-0.5">For</span>
                    <select
                        value={updates.paid_for}
                        onChange={(e) => {
                            const next = { ...updates, paid_for: e.target.value };
                            setUpdates(next);
                            onUpdate?.(item.id, next);
                        }}
                        className="bg-transparent text-[13px] font-black text-[#93A4C2] outline-none cursor-pointer uppercase"
                    >
                        <option value="Both">BOTH</option>
                        <option value="CY">CY</option>
                        <option value="HY">HY</option>
                    </select>
                </div>
            </div>

            <div className="xl:col-span-1 flex items-center justify-end gap-2">
                <button
                    onClick={() => onConfirm(item.id, updates)}
                    className="bg-[#2E7CF6] hover:bg-black text-white px-4 py-2.5 rounded-xl font-black text-[9px] transition-all active:scale-[0.95] shadow-lg shadow-indigo-500/5 whitespace-nowrap"
                >
                    確認
                </button>
                <button
                    onClick={() => onDelete(item.id)}
                    className="p-2.5 text-[#5A6B89] hover:text-rose-600 bg-[#111A2E] hover:bg-rose-50 rounded-xl transition-all border border-transparent"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
});
