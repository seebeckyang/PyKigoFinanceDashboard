"use client";

import React, { useState, memo } from 'react';
import {
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Info,
    X,
    History,
    PenLine,
    Trash2,
    ArrowRightLeft,
    Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Settlement Summary Card
 */
export const SettlementSummary = memo(function SettlementSummary({
    settlement,
    onOpenSettlement,
    onOpenHistory
}: {
    settlement: any,
    onOpenSettlement: () => void,
    onOpenHistory: () => void
}) {
    if (!settlement) return null;

    return (
        <div className="bg-[#0B1220] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2E7CF6]/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#2E7CF6]/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#10B981]/100/10 rounded-full -ml-24 -mb-24 blur-3xl group-hover:bg-[#10B981]/100/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col h-full space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">Live Settlement Status</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-1">
                                本期家庭總支出
                            </h3>
                            <div className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#111A2E] to-gray-400">
                                NT$ {(settlement.cy_credit + settlement.cy_debit).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onOpenHistory}
                                className="p-3 bg-[#111A2E]/80 hover:bg-[#16223D]/80 rounded-2xl transition-all border border-[#16223D]/50 text-[#5A6B89] hover:text-white group/hist"
                                title="查看歷史紀錄"
                            >
                                <History className="w-5 h-5 group-hover/hist:rotate-[-45deg] transition-transform" />
                            </button>
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-inner",
                                settlement.net_balance <= 0 ? "bg-[#2E7CF6]/10 text-[#22D3EE] border-[#2E7CF6]/20" : "bg-[#10B981]/100/10 text-emerald-400 border-emerald-500/20"
                            )}>
                                <Layers className="w-3.5 h-3.5" />
                                {settlement.balance_status}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#16223D]/30 p-4 rounded-3xl border border-[#1F2C4A]/50 backdrop-blur-md">
                        <div className="text-[10px] font-black text-[#93A4C2] uppercase mb-1 tracking-widest text-center sm:text-left">CY 出</div>
                        <div className="text-xl md:text-2xl font-black text-slate-100 text-center sm:text-left">NT$ {settlement.cy_credit.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#16223D]/30 p-4 rounded-3xl border border-[#1F2C4A]/50 backdrop-blur-md">
                        <div className="text-[10px] font-black text-[#93A4C2] uppercase mb-1 tracking-widest text-center sm:text-left">HY 出</div>
                        <div className="text-xl md:text-2xl font-black text-slate-100 text-center sm:text-left">NT$ {settlement.cy_debit.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-[#2E7CF6]/5 border border-[#2E7CF6]/10 rounded-2xl">
                    <div className="w-1.5 h-1.5 bg-[#2E7CF6] rounded-full"></div>
                    <span className="text-[10px] font-bold text-[#5A6B89] uppercase tracking-widest leading-none">
                        {settlement.summary}
                    </span>
                </div>

                <div className="mt-auto">
                    <button
                        onClick={onOpenHistory}
                        className="w-full bg-[#16223D] hover:bg-[#1F2C4A] text-[#E6EDF7] py-4.5 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-3 relative z-10 shadow-xl shadow-indigo-900/20 active:scale-[0.98] border border-[#1F2C4A]/60 group/btn"
                        style={{ height: '56px' }}
                    >
                        <History className="w-5 h-5 text-[#22D3EE] transition-transform group-hover/btn:scale-110" />
                        查看支出歷史
                    </button>
                </div>
            </div>
        </div>
    );
});

/**
 * Settlement History Modal
 */
export function SettlementHistoryModal({
    history,
    onClose,
    onDelete,
    onEdit
}: {
    history: any[],
    onClose: () => void,
    onDelete?: (id: string) => void,
    onEdit?: (item: any) => void
}) {
    return (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-[#111A2E] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#1F2C4A]/60 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-[#1F2C4A]/60 flex items-center justify-between bg-[#111A2E]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#16223D] flex items-center justify-center">
                            <History className="w-5 h-5 text-[#2E7CF6]" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-xl text-[#E6EDF7] tracking-tight">結算歷史紀錄</h3>
                            <p className="text-xs text-[#93A4C2] font-medium">記錄過往的所有全額與部分結算</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#111A2E] rounded-full transition-colors border border-transparent hover:border-[#1F2C4A]/60 shadow-sm">
                        <X className="w-5 h-5 text-[#5A6B89]" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
                    {history.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-[#111A2E] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-[#1F2C4A]">
                                <History className="w-8 h-8 text-[#5A6B89]" />
                            </div>
                            <p className="text-[#5A6B89] font-bold">尚無結算紀錄</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="group flex items-center justify-between p-4 rounded-2xl border border-[#1F2C4A]/60 hover:border-[#2E7CF6]/20 hover:bg-[#16223D]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                                        item.payer === 'CY' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                                    )}>
                                        {item.payer}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-bold text-[#E6EDF7] flex items-center gap-2">
                                            NT$ {item.amount.toLocaleString()}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16223D] text-[#93A4C2] font-bold uppercase tracking-wider">
                                                Paid to {item.payee}
                                            </span>
                                        </div>
                                        <div className="text-xs font-semibold text-[#5A6B89] mt-0.5">
                                            {item.settlement_date} • {item.notes || '無備註'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                        <div className="text-[10px] font-bold text-[#2E7CF6] uppercase tracking-widest bg-[#16223D] px-2 py-1 rounded-lg">
                                            {item.project_label === 'all' ? '全專案' : item.project_label}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit?.(item)}
                                            className="p-2 text-[#5A6B89] hover:text-[#2E7CF6] hover:bg-[#111A2E] rounded-xl transition-all shadow-sm"
                                        >
                                            <PenLine className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(item.id)}
                                            className="p-2 text-[#5A6B89] hover:text-[#EF4444] hover:bg-[#111A2E] rounded-xl transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-[#111A2E] border-t border-[#1F2C4A]/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#16223D] border border-[#1F2C4A] rounded-xl text-sm font-bold text-[#93A4C2] hover:bg-[#111A2E] transition-all shadow-sm"
                    >
                        關閉視窗
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Partial Settlement Modal
 */
export function PartialSettlementModal({
    settlement,
    activeTab,
    goals,
    onClose,
    onSubmit,
    isEditing
}: any) {
    const [amount, setAmount] = useState(isEditing ? (settlement.amount || 0) : (settlement.abs_balance || 0));
    const [notes, setNotes] = useState(settlement.notes || '');
    const [date, setDate] = useState(settlement.settlement_date || new Date().toISOString().split('T')[0]);

    const isCYPaying = isEditing
        ? settlement.payer === 'CY'
        : (settlement.net_balance || 0) < 0;
    const isHYPaying = isEditing
        ? settlement.payer === 'HY'
        : (settlement.net_balance || 0) > 0;

    const currentAbsBalance = isEditing ? (settlement.amount || 0) : (settlement.abs_balance || 0);

    const handleSubmit = () => {
        if (amount <= 0 || (!isEditing && currentAbsBalance > 0 && amount > currentAbsBalance + 1)) {
            alert('金額必須大於 0');
            return;
        }

        const isGoalTab = activeTab !== 'all' && activeTab !== 'general';
        onSubmit({
            amount,
            settlement_date: date,
            payer: isCYPaying ? 'CY' : 'HY',
            payee: isCYPaying ? 'HY' : 'CY',
            project_label: isGoalTab ? 'all' : activeTab,
            goal_id: isGoalTab ? activeTab : null,
            notes: notes || (isEditing ? '' : (amount < currentAbsBalance ? '部份結算' : '全額結算'))
        });
    };

    return (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-[#111A2E] rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-[#1F2C4A]/60">
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-[#2E7CF6] flex items-center justify-center shadow-lg shadow-indigo-200">
                            <ArrowRightLeft className="w-7 h-7 text-white" />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[#16223D] rounded-xl transition-colors">
                            <X className="w-6 h-6 text-[#5A6B89]" />
                        </button>
                    </div>

                    <h3 className="text-2xl font-black text-[#E6EDF7] tracking-tight mb-2">
                        {isEditing ? '編輯結算紀錄' : '執行分帳結算'}
                    </h3>
                    <p className="text-[#93A4C2] font-medium">
                        {isEditing ? '修改過往的結算金額或備註' : '記錄雙方之間的代墊款項償還情況'}
                    </p>

                    <div className="mt-8 space-y-6">
                        <div className="bg-[#F59E0B]/10 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-sm border",
                                    isCYPaying ? "bg-blue-600 text-white border-blue-400" : "bg-emerald-600 text-white border-emerald-400"
                                )}>
                                    {isCYPaying ? 'CY' : 'HY'}
                                </div>
                                <div className="text-amber-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Payer</div>
                                    <div className="text-sm font-bold">
                                        {isEditing ? `結算金額 NT$ ${settlement.amount.toLocaleString()}` : `目前總欠款 NT$ ${(settlement.abs_balance || 0).toLocaleString()}`}
                                    </div>
                                </div>
                            </div>
                            <div className="h-6 w-px bg-amber-200"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right text-amber-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Payee</div>
                                    <div className="text-sm font-bold">{isCYPaying ? 'HY' : 'CY'}</div>
                                </div>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-sm border",
                                    !isCYPaying ? "bg-blue-600 text-white border-blue-400" : "bg-emerald-600 text-white border-emerald-400"
                                )}>
                                    {!isCYPaying ? 'CY' : 'HY'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-[#5A6B89] uppercase tracking-widest mb-2 block">結算金額</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#5A6B89] text-xl">NT$</div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-[#111A2E] border-2 border-[#1F2C4A]/60 rounded-2xl py-4 pl-16 pr-6 font-black text-3xl text-[#E6EDF7] focus:border-[#2E7CF6] transition-all outline-none"
                                />
                            </div>
                            {!isEditing && (
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setAmount(settlement.abs_balance || 0)}
                                        className="text-[10px] font-black bg-white border border-[#1F2C4A] px-3 py-1 rounded-lg text-[#93A4C2] hover:border-[#2E7CF6] hover:text-[#2E7CF6] transition-all shadow-sm"
                                    >
                                        全額結算
                                    </button>
                                    <button
                                        onClick={() => setAmount(Math.round((settlement.abs_balance || 0) / 2))}
                                        className="text-[10px] font-black bg-white border border-[#1F2C4A] px-3 py-1 rounded-lg text-[#93A4C2] hover:border-[#2E7CF6] hover:text-[#2E7CF6] transition-all shadow-sm"
                                    >
                                        結算一半
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-[#5A6B89] uppercase tracking-widest mb-2 block">結算日期</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-[#111A2E] border-2 border-[#1F2C4A] rounded-xl py-2 px-3 font-bold text-[#E6EDF7] text-sm focus:border-[#2E7CF6] transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-[#5A6B89] uppercase tracking-widest mb-2 block">結算範圍</label>
                                <div className="bg-[#16223D] rounded-xl py-2 px-3 text-sm font-bold text-[#93A4C2] flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> {activeTab === 'all' ? '全帳本' : (activeTab === 'general' ? '日常家庭' : goals?.find((g: any) => g.id === activeTab)?.name)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-[#5A6B89] uppercase tracking-widest mb-2 block">備註</label>
                            <input
                                type="text"
                                placeholder="例如：由轉帳支付..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-[#111A2E] border-2 border-[#1F2C4A]/60 rounded-xl py-2 px-4 font-bold text-[#E6EDF7] text-sm focus:border-[#2E7CF6] transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-[#111A2E] text-[#93A4C2] rounded-2xl font-black text-sm hover:bg-[#16223D] transition-all border border-[#1F2C4A]/60"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-[2] py-4 bg-[#2E7CF6] text-white rounded-2xl font-black text-sm hover:bg-[#1a6ae3] transition-all shadow-xl shadow-[#2E7CF6]/10 border border-[#2E7CF6]"
                    >
                        確認結算
                    </button>
                </div>
            </div>
        </div>
    );
}
