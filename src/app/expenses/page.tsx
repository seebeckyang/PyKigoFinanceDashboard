"use client";

import React, { useState } from 'react';
import {
    Plus,
    Zap,
    ChevronRight,
    TrendingUp,
    LayoutGrid,
    Target,
    Users2,
    BarChart3,
    CheckCircle,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useExpenses } from "@/hooks/useExpenses";
import { SettlementSummary } from "@/components/expenses/SettlementSummary";
import {
    ExpenseModals,
    ExpenseEntryModal,
    CategoryManagementModal,
    ImportDataModal
} from "@/components/expenses/ExpenseModals";
import {
    TabButton,
    ExpenseItemCard,
    AllExpensesModal,
    BatchActionsBar
} from "@/components/expenses/ExpenseGroups";
import { StatCard } from "@/components/expenses/StatCard";
import { ExpenseCategoryChart } from "@/components/expenses/ExpenseCategoryChart";
import { VoiceExpense } from "@/components/expenses/VoiceExpense";
import { useFxRates } from "@/lib/fx";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function ExpensesPage() {
    const {
        expenses,
        unreviewed,
        recentExpenses,
        categories,
        goals,
        settlement,
        settlementHistory,
        isLoading,
        isInitialLoading,
        activeTab,
        setActiveTab,

        // Modals
        showModal, setShowModal,
        showImportModal, setShowImportModal,
        showCategoryMgmt, setShowCategoryMgmt,
        showHistoryModal, setShowHistoryModal,
        showPartialSettlementModal, setShowPartialSettlementModal,
        showAllExpensesModal, setShowAllExpensesModal,
        editingSettlement, setEditingSettlement,

        // Filters
        startDate, setStartDate,
        endDate, setEndDate,

        // Actions
        loadData,
        handleConfirm,
        handleBatchConfirm,
        handleDeleteExpense,
        handleDeleteBulk,
        handleCreateExpense,
        handleCreateExpenses,
        handleProcessAIImport,
        handleDeleteSettlement,
        handleSaveSettlement,

        // Stats
        filterMode, setFilterMode,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedQuarter, setSelectedQuarter,
        stats,

        // Unified List & Batch Actions
        showUnconfirmedOnly, setShowUnconfirmedOnly,
        selectedIds, setSelectedIds, toggleSelection, toggleSelectAll,
        stagedUpdates, setStagedUpdates, handleStageUpdate,
        isBatchMode, setIsBatchMode,
        paidForFilter, setPaidForFilter,
        handleBatchConfirmChanges
    } = useExpenses();

    const [isListExpanded, setIsListExpanded] = useState(false);

    // 即時匯率（多幣別支出統一換算成 TWD）
    const { convertToTWD, source: fxSource, fetchedAt: fxFetchedAt } = useFxRates();

    // 本期累積支出（以 TWD 為單位）
    // 說明：stats.currentMonth.total 是 Supabase server-side 加總原始 amount，不懂幣別。
    // 正確做法：在 client 端拿本期 expenses，一筆筆用 fx 換算後再加總。
    const currentMonthExpenses = React.useMemo(() => {
        if (!expenses || expenses.length === 0) return 0;
        return expenses.reduce(
            (sum, e: any) => sum + convertToTWD(e.amount, e.currency || "TWD"),
            0
        );
    }, [expenses, convertToTWD]);

    // Accurate daily average calculation based on selected range
    const daysCount = React.useMemo(() => {
        if (!startDate || !endDate) return 1;
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // If the selected range includes "today", we only average up to today for a more realistic estimate
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (s <= today && e >= today) {
            return Math.ceil((today.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        return diff || 1;
    }, [startDate, endDate]);

    const avgDaily = React.useMemo(() =>
        currentMonthExpenses / daysCount,
        [currentMonthExpenses, daysCount]);

    // Goal progress (if activeTab is a goal)
    const activeGoal = React.useMemo(() =>
        goals.find(g => g.id === activeTab) || null,
        [goals, activeTab]);

    const isProjectTab = activeTab !== 'all' && activeTab !== 'general';

    const goalProjectExpenses = React.useMemo(() =>
        stats?.allTimeTotal || 0,
        [stats?.allTimeTotal]);

    const goalProgress = React.useMemo(() =>
        activeGoal ? (goalProjectExpenses / (activeGoal.target_amount || 1)) * 100 : 0,
        [activeGoal, goalProjectExpenses]);

    // === Client-side overrides for Settlement and Category Chart (multi-currency aware) ===
    // 規則：家庭共享支出不平分 - paid_by 自己出的就全算自己（CY/HY 各自負擔），不再 ×0.5
    // 所有金額一律先用 fx 換算成 TWD 再加總
    const clientSettlement = React.useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return {
                cy_credit: 0,
                cy_debit: 0,
                net_balance: 0,
                base_balance: 0,
                settled_total: 0,
                summary: "雙方互不相欠",
                abs_balance: 0,
                balance_status: "已結清"
            };
        }
        let cyOut = 0;  // CY 出的錢 (全額算)
        let hyOut = 0;  // HY 出的錢 (全額算)
        (expenses as any[]).forEach(e => {
            if (e.is_reviewed === false) return;
            const amt = convertToTWD(e.amount, e.currency || "TWD");
            const pBy = String(e.paid_by || "").toUpperCase();
            if (pBy === "CY") cyOut += amt;
            else if (pBy === "HY") hyOut += amt;
        });
        // 家庭共享不平分：CY 出的就是 CY 出的，HY 出的就是 HY 出的
        // net_balance > 0 表示 CY 出比較多，HY 應給付 CY (但既然是家庭共享，這裡只是參考)
        const net = cyOut - hyOut;
        return {
            cy_credit: Math.round(cyOut),
            cy_debit: Math.round(hyOut),
            net_balance: Math.round(net),
            base_balance: Math.round(net),
            settled_total: 0,
            summary: "家庭共享支出（不平分）",
            abs_balance: Math.round(Math.abs(net)),
            balance_status: net === 0 ? "已結清" : "家庭共享"
        };
    }, [expenses, convertToTWD]);

    const clientCategoryStats = React.useMemo(() => {
        if (!expenses || expenses.length === 0 || !categories) return [];
        const catMap = new Map((categories as any[]).map(c => [c.id, c]));
        const groups = new Map<string, { name: string; amount: number; color: string }>();
        (expenses as any[]).forEach(e => {
            if (e.is_reviewed === false) return;
            const cat = catMap.get(e.category_id);
            const name = cat?.name || "其他";
            const color = cat?.color || "#94a3b8";
            const amt = convertToTWD(e.amount, e.currency || "TWD");
            const existing = groups.get(name);
            if (existing) existing.amount += amt;
            else groups.set(name, { name, amount: amt, color });
        });
        return Array.from(groups.values())
            .map(g => ({ ...g, amount: Math.round(g.amount) }))
            .sort((a, b) => b.amount - a.amount);
    }, [expenses, categories, convertToTWD]);

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#2E7CF6]/30 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm font-black text-[#5A6B89] uppercase tracking-widest">初始化數據中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "max-w-[1600px] mx-auto p-4 md:p-10 space-y-10 font-sans pb-32 transition-opacity duration-300",
            isLoading ? "opacity-60 pointer-events-none" : "opacity-100"
        )}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#2E7CF6] text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#E6EDF7] tracking-tighter">
                            支出 <span className="text-[#2E7CF6]">管理中心</span>
                        </h1>
                    </div>
                    <p className="text-sm font-bold text-[#5A6B89] uppercase tracking-widest pl-1">智慧支出追蹤與結算</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <VoiceExpense isDemo={IS_DEMO} />
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 md:gap-2.5 px-4 md:px-6 py-3 md:py-4 bg-[#F59E0B] hover:bg-[#d4880a] text-white rounded-2xl md:rounded-[1.5rem] font-black text-xs md:text-sm transition-all shadow-xl shadow-[#F59E0B]/10 border border-[#F59E0B] active:scale-95 group flex-1 md:flex-none"
                    >
                        <Zap className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                        AI 智慧匯入
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 md:gap-2.5 px-6 md:px-8 py-3 md:py-4 bg-[#2E7CF6] hover:bg-[#1a6ae3] text-white rounded-2xl md:rounded-[1.5rem] font-black text-xs md:text-sm transition-all shadow-xl shadow-[#2E7CF6]/10 border border-[#2E7CF6] active:scale-95 group flex-1 md:flex-none"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform" />
                        手動記帳
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Stats Section */}
                <div className="lg:col-span-7 flex flex-col gap-6 h-full">
                    {/* Relocated Filters - Two Rows */}
                    <div className="space-y-4">
                        {/* Row 1: Project Tabs */}
                        <div className="bg-[#16223D]/40 p-3 rounded-3xl border border-[#1F2C4A]/60 shadow-sm backdrop-blur-sm">
                            <div className="flex items-center gap-1 bg-[#16223D]/50 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                                <TabButton
                                    active={activeTab === 'all'}
                                    onClick={() => setActiveTab('all')}
                                    icon={<LayoutGrid className="w-4 h-4" />}
                                    label="全部"
                                />
                                <TabButton
                                    active={activeTab === 'general'}
                                    onClick={() => setActiveTab('general')}
                                    icon={<Users2 className="w-4 h-4" />}
                                    label="日常"
                                />
                                {goals.map(goal => (
                                    <TabButton
                                        key={goal.id}
                                        active={activeTab === goal.id}
                                        onClick={() => setActiveTab(goal.id)}
                                        icon={<Target className="w-4 h-4" />}
                                        label={goal.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Row 2: Shared Filters Row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Paid For Filter - Always Visible */}
                            <div className="bg-[#16223D]/40 p-2 rounded-2xl border border-[#1F2C4A]/60 shadow-sm backdrop-blur-sm flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#5A6B89] uppercase tracking-widest pl-2">對象</span>
                                <div className="flex items-center gap-1 bg-[#16223D]/50 p-1 rounded-xl">
                                    {[
                                        { id: 'Both', label: '全部' },
                                        { id: 'CY', label: 'CY' },
                                        { id: 'HY', label: 'HY' }
                                    ].map(beneficiary => (
                                        <button
                                            key={beneficiary.id}
                                            onClick={() => setPaidForFilter(beneficiary.id)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                                paidForFilter === beneficiary.id ? "bg-[#16223D] text-[#2E7CF6] shadow-sm border border-[#2E7CF6]/30" : "text-[#5A6B89] hover:text-[#93A4C2]"
                                            )}
                                        >
                                            {beneficiary.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Mode & Range Picker - Hide only when in project view */}
                            {!isProjectTab && (
                                <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#16223D]/40 p-3 rounded-[2rem] border border-[#1F2C4A]/60 shadow-sm backdrop-blur-sm gap-4 animate-in fade-in slide-in-from-top-2 flex-1">
                                    <div className="flex items-center gap-2 bg-[#16223D]/50 p-1 rounded-2xl">
                                        {[
                                            { id: 'month', label: '月' },
                                            { id: 'quarter', label: '季' },
                                            { id: 'year', label: '年' }
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setFilterMode(mode.id as any)}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-xl text-[10px] font-black transition-all",
                                                    filterMode === mode.id ? "bg-[#16223D] text-[#2E7CF6] shadow-sm border border-[#2E7CF6]/30" : "text-[#5A6B89] hover:text-[#93A4C2]"
                                                )}
                                            >
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 bg-[#111A2E] border border-[#1F2C4A]/60 p-1.5 px-4 rounded-2xl shadow-sm flex-1 md:flex-none">
                                        <Calendar className="w-4 h-4 text-[#2E7CF6]" />
                                        <div className="flex items-center gap-4">
                                            {filterMode === 'month' && (
                                                <div className="flex flex-col">
                                                    <input
                                                        type="month"
                                                        value={selectedMonth}
                                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                                        className="bg-transparent border-none pr-3 text-sm font-black text-[#E6EDF7] outline-none cursor-pointer leading-tight uppercase"
                                                    />
                                                </div>
                                            )}
                                            {filterMode === 'quarter' && (
                                                <>
                                                    <div className="flex flex-col">
                                                        <select
                                                            value={selectedYear}
                                                            onChange={(e) => setSelectedYear(e.target.value)}
                                                            className="bg-transparent border-none text-sm font-black text-[#E6EDF7] outline-none cursor-pointer leading-tight"
                                                        >
                                                            {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="w-px h-6 bg-[#16223D]" />
                                                    <div className="flex flex-col">
                                                        <select
                                                            value={selectedQuarter}
                                                            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                                                            className="bg-transparent border-none text-sm font-black text-[#E6EDF7] outline-none cursor-pointer leading-tight uppercase"
                                                        >
                                                            {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {filterMode === 'year' && (
                                                <div className="flex flex-col">
                                                    <select
                                                        value={selectedYear}
                                                        onChange={(e) => setSelectedYear(e.target.value)}
                                                        className="bg-transparent border-none text-sm font-black text-[#E6EDF7] outline-none cursor-pointer leading-tight"
                                                    >
                                                        {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y} 年度</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!isProjectTab && (
                            <>
                                <StatCard
                                    icon={<TrendingUp className="w-6 h-6" />}
                                    label={`${filterMode === 'month' ? '本月' : filterMode === 'quarter' ? '本季' : '本年'}累積支出`}
                                    value={`NT$ ${Math.round(currentMonthExpenses).toLocaleString()}`}
                                    subtext={`期間：${startDate} 至 ${endDate}　|　匯率：${fxSource === 'live' ? '即時' : '備援'}${fxFetchedAt ? ' · ' + new Date(fxFetchedAt).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' }) : ''}`}
                                    color="indigo"
                                    change={stats?.comparison !== undefined ? `${stats.comparison > 0 ? '+' : ''}${stats.comparison}%` : undefined}
                                    loading={isLoading}
                                />
                                <StatCard
                                    icon={<BarChart3 className="w-6 h-6" />}
                                    label={`${filterMode === 'month' ? '日均' : filterMode === 'quarter' ? '季日均' : '年日均'}支出估算`}
                                    value={`NT$ ${Math.round(avgDaily).toLocaleString()}`}
                                    subtext={`基於本期間 ${daysCount} 天的 TWD 換算平均值`}
                                    color="amber"
                                    loading={isLoading}
                                />
                            </>
                        )}

                        {activeGoal ? (
                            <div className="md:col-span-2">
                                <StatCard
                                    icon={<Target className="w-6 h-6" />}
                                    label={`${activeGoal?.name || '目標'} 達成進度`}
                                    value={`${Math.round(goalProgress)}% (${goalProjectExpenses.toLocaleString()} / ${activeGoal.target_amount?.toLocaleString()})`}
                                    subtext={`距離目標還差 NT$ ${Math.max(0, (activeGoal.target_amount || 0) - goalProjectExpenses).toLocaleString()}`}
                                    progress={goalProgress}
                                    project
                                    loading={isLoading}
                                />
                            </div>
                        ) : (
                            <div className="md:col-span-2">
                                <div className="bg-[#111A2E] rounded-[2.5rem] p-8 shadow-sm border border-[#1F2C4A]/60 h-full flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-[#16223D] flex items-center justify-center text-[#2E7CF6]">
                                                <BarChart3 className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-black text-lg text-[#E6EDF7] tracking-tight">支出類別分佈</h3>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-[#5A6B89] uppercase tracking-widest mb-1">{filterMode === 'month' ? '單月' : filterMode === 'quarter' ? '單季' : '年度'}日常生活支出</span>
                                                <div className="text-3xl font-black text-[#E6EDF7] tracking-tighter">
                                                    NT$ {Math.round(expenses.filter((e: any) => !e.goal_id).reduce((sum, e: any) => sum + convertToTWD(e.amount, e.currency || "TWD"), 0)).toLocaleString()}
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium text-[#5A6B89] leading-relaxed">
                                                展示此{filterMode === 'month' ? '月份' : filterMode === 'quarter' ? '季度' : '年度'}各類別的支出比例，協助您掌握預算流向。您可以切換上方{filterMode === 'month' ? '月、季、年' : '切換條件'}查看不同時期的消費習慣。
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-[280px] h-[300px] flex items-center justify-center">
                                        <ExpenseCategoryChart
                                            data={clientCategoryStats}
                                            loading={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Settlement Section */}
                <div className="lg:col-span-5 h-full">
                    <SettlementSummary
                        settlement={clientSettlement}
                        onOpenHistory={() => setShowHistoryModal(true)}
                        onOpenSettlement={() => setShowPartialSettlementModal(true)}
                    />
                </div>
            </div>

            {/* Focused Action Section */}
            <div className="bg-[#0B1220] rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#2E7CF6]/10 blur-[100px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-[#2E7CF6]/20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F59E0B]/5 blur-[80px] rounded-full -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16223D]/30 border border-[#1F2C4A]/50 text-[10px] font-black text-[#22D3EE] uppercase tracking-widest mb-6">
                            交易明細管理
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                            管理您的所有 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E7CF6] to-[#93A4C2]">收支細目</span>
                        </h3>
                        <p className="text-[#5A6B89] font-medium text-lg mt-6 leading-relaxed">
                            進入專屬管理中心進行批次編輯、手動確認 AI 匯入項目，以及查看完整的歷史收支紀錄。
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAllExpensesModal(true)}
                        className="flex-shrink-0 flex items-center gap-4 px-10 py-6 bg-[#16223D] hover:bg-[#1F2C4A] text-[#E6EDF7] border border-[#1F2C4A] rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-[#2E7CF6]/15 active:scale-95 group"
                    >
                        管理交易明細
                        <div className="w-8 h-8 rounded-full bg-[#2E7CF6] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Modals Assembly */}
            <ExpenseModals
                showModal={showModal}
                setShowModal={setShowModal}
                showImportModal={showImportModal}
                setShowImportModal={setShowImportModal}
                showCategoryMgmt={showCategoryMgmt}
                setShowCategoryMgmt={setShowCategoryMgmt}
                showHistoryModal={showHistoryModal}
                setShowHistoryModal={setShowHistoryModal}
                showPartialSettlementModal={showPartialSettlementModal}
                setShowPartialSettlementModal={setShowPartialSettlementModal}
                showAllExpensesModal={showAllExpensesModal}
                setShowAllExpensesModal={setShowAllExpensesModal}

                categories={categories}
                goals={goals}
                settlement={settlement}
                settlementHistory={settlementHistory}
                editingSettlement={editingSettlement}
                setEditingSettlement={setEditingSettlement}

                activeTab={activeTab}
                startDate={startDate}
                endDate={endDate}

                onUpdate={loadData}
                handleCreateExpense={handleCreateExpense}
                handleCreateExpenses={handleCreateExpenses}
                handleProcessAIImport={handleProcessAIImport}
                handleDeleteSettlement={handleDeleteSettlement}
                handleSaveSettlement={handleSaveSettlement}
            />
        </div>
    );
}
