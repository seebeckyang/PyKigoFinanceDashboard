"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, AlertTriangle, ShieldCheck, ChevronRight, Activity, Search, Target, PenLine, ExternalLink, ArrowRight, PanelRightClose, PanelRightOpen, Globe, ChevronDown } from "lucide-react";
import { getPlanningData, updateAssetStrategy } from "@/app/actions/planning";
import { getLatestDashboardData } from "@/app/actions/dashboard";
import TradingViewChart from "@/components/dashboard/TradingViewChart";
import StockPlanningNotes from "@/components/dashboard/StockPlanningNotes";
import { LiveMarketTicker } from "@/components/dashboard/LiveMarketTicker";

export default function PlanningPage() {
    const [planningData, setPlanningData] = useState<any>(null);
    const [actualAllocation, setActualAllocation] = useState<any[]>([]);
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const load = async () => {
            const plan = await getPlanningData();
            const dash = await getLatestDashboardData();

            setPlanningData(plan);
            setActualAllocation(dash.strategyAllocationData || []);

            // Set default selected stock if available
            if (plan.availableStocks && plan.availableStocks.length > 0 && !selectedStock) {
                setSelectedStock(plan.availableStocks[0].symbol);
            }

            setLoading(false);
        };
        load();
    }, []);

    const handleCategoryChange = async (assetId: string, newCategory: string) => {
        try {
            await updateAssetStrategy(assetId, newCategory);
            // Refresh data to reflect rebalancing changes
            const plan = await getPlanningData();
            const dash = await getLatestDashboardData();
            setPlanningData(plan);
            setActualAllocation(dash.strategyAllocationData || []);
        } catch (err) {
            console.error("Failed to update strategy:", err);
        }
    };

    if (loading || !planningData) return <div className="p-8 animate-pulse text-[#5A6B89]">正在規劃您的財富藍圖中...</div>;

    const selectedAsset = planningData.availableStocks?.find((s: any) => s.symbol === selectedStock);

    // Calculate Achievement (Dividend / Goal) 
    const currentDividend = planningData.dividendProjections?.[0]?.amount || 0;
    const monthlyIncomeGoal = planningData.userGoal?.target_monthly_income || 50000;
    const annualGoal = monthlyIncomeGoal * 12;
    const achievementPercent = Math.min(100, Math.round((currentDividend / annualGoal) * 100));

    // Improved Rebalancing Logic: Comparison by Category
    const rebalanceItems = planningData.strategyTargets.map((target: any) => {
        const targetLabel = target.category.trim().toLowerCase();
        // Find matching actual allocation slice
        const actual = actualAllocation.find(a => {
            const actualLabel = a.name.trim().toLowerCase();
            return targetLabel.includes(actualLabel) || actualLabel.includes(targetLabel);
        }) || { value: 0 };

        const diff = actual.value - target.target_percentage;
        return { ...target, actual: actual.value, diff };
    });
    const rebalanceNeeded = rebalanceItems.some((item: any) => Math.abs(item.diff) > planningData.rebalancingThreshold);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-12">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-3xl font-black text-[#E6EDF7] tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-[#2E7CF6]" />
                            投資策略指揮中心
                        </h1>
                        <span className="bg-[#111A2E] text-[#1a6ae3] text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-sm">版本 V1.2</span>
                    </div>
                    <p className="text-[#93A4C2] mt-2 text-sm font-semibold opacity-80">
                        整合即時行情分析、個人化交易筆記與長期配置策略
                    </p>
                </div>
                <div className="bg-[#10B981]/10 border border-[#10B981]/20 px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="bg-[#10B981]/100 p-1.5 rounded-full shadow-lg shadow-emerald-200">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] text-[#10B981] font-black uppercase tracking-widest">{planningData.userGoal?.goal_name || '財富自由'}進度</div>
                        <div className="text-lg font-black text-[#E6EDF7] leading-tight">
                            {achievementPercent}% <span className="text-xs font-bold text-[#5A6B89]">已達成</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 即時市場行情（每 60 秒輪詢） */}
            <LiveMarketTicker
                tickers={(planningData.availableStocks || []).map((s: any) => s.symbol).filter(Boolean)}
                title="持股即時行情"
            />

            {/* 1. High Level Overview Row (Portfolio Stats) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Module 1: Portfolio Rebalancing */}
                <div className="glass p-8 rounded-3xl border border-[#1F2C4A] shadow-lg space-y-6 bg-gradient-to-br from-[#111A2E]/80 to-[#16223D]/50 overflow-visible relative z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-[#E6EDF7] flex items-center gap-3">
                                <Activity className="w-6 h-6 text-[#2E7CF6]" />
                                資產再平衡對照 (Rebalancing)
                            </h2>
                            <p className="text-xs font-bold text-[#5A6B89] mt-1">目前實際配額 vs 理想目標偏離值</p>
                        </div>
                        {rebalanceNeeded && (
                            <div className="bg-[#F59E0B]/15 text-[#F59E0B] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                                Rebalance Recommended
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 h-44">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-[#5A6B89] uppercase tracking-widest mb-4">目標配置 (Target)</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={planningData.strategyTargets} dataKey="target_percentage" innerRadius={40} outerRadius={60} paddingAngle={8} minAngle={15}>
                                        {planningData.strategyTargets.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-[#5A6B89] uppercase tracking-widest mb-4">實際資產 (Actual)</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={actualAllocation} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={8} minAngle={15}>
                                        {actualAllocation.map((entry: any, index: number) => {
                                            const target = planningData.strategyTargets.find((t: any) => t.category.toLowerCase().includes(entry.name.toLowerCase()));
                                            return <Cell key={`cell-${index}`} fill={target?.color || "#CBD5E1"} stroke="none" />;
                                        })}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Rebalancing Actions List */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#1F2C4A]/60">
                        {rebalanceItems.map((item: any) => {
                            const getDefinition = (cat: string) => {
                                if (cat.includes("核心")) return "基石資產，追求市場平均報酬（如 0050、VOO），波動相對穩定。";
                                if (cat.includes("成長")) return "具有高潛力的科技股或動能標的，追求超額報酬，但波動較高。";
                                if (cat.includes("定存")) return "低波動、提供穩定現金流的資產（如金融股、高股息 ETF），旨在保護本金。";
                                if (cat.includes("投機")) return "用於捕捉極端機會的槓桿標的、波段操作資金，或隨時可動用的靈活現金。";
                                return "此類別的投資策略說明。";
                            };

                            return (
                                <div key={item.category} className="flex flex-col bg-[#111A2E] p-2.5 rounded-xl border border-[#1F2C4A]/60 shadow-sm relative group/card cursor-help overflow-visible">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: item.color }}></div>

                                    {/* Tooltip Popup - Popping Down */}
                                    <div className="absolute left-0 top-full mt-2 w-48 p-3 bg-[#0B1220] text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover/card:opacity-100 pointer-events-none transition-all duration-300 z-[100] transform -translate-y-1 group-hover/card:translate-y-0 text-left">
                                        <div className="font-black mb-1 border-b border-[#1F2C4A]/50 pb-1" style={{ color: item.color }}>{item.category}</div>
                                        <div className="leading-relaxed text-white/80 font-medium whitespace-normal">{getDefinition(item.category)}</div>
                                        <div className="absolute left-4 -top-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-slate-900"></div>
                                    </div>

                                    <div className="text-[9px] font-black text-[#5A6B89] truncate pl-1 flex items-center gap-1">
                                        {item.category}
                                    </div>
                                    <div className="flex items-center justify-between mt-1 pl-1">
                                        <div className="text-[10px] font-bold text-[#E6EDF7]">{item.actual}%</div>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${item.diff > 2 ? 'bg-rose-100 text-rose-600' :
                                            item.diff < -2 ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#16223D] text-[#5A6B89]'
                                            }`}>
                                            {item.diff > 2 ? 'Sell' : item.diff < -2 ? 'Buy' : 'Hold'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Module 2: Dividend Snowball */}
                <div className="glass p-8 rounded-3xl border border-[#1F2C4A] shadow-lg space-y-6 bg-gradient-to-br from-[#111A2E]/80 to-[#10B981]/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-[#E6EDF7] flex items-center gap-3 group relative">
                                <TrendingUp className="w-6 h-6 text-[#10B981]" />
                                股息滾雪球預測
                                <div className="relative group/tooltip">
                                    <Activity className="w-4 h-4 text-[#5A6B89] hover:text-[#2E7CF6] cursor-help transition-colors" />
                                    <div className="absolute left-0 top-full mt-3 w-64 p-4 bg-[#0B1220] text-white text-[11px] rounded-2xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 z-50 transition-translate transform -translate-y-2 group-hover/tooltip:translate-y-0">
                                        <div className="font-black text-[#22D3EE] mb-2 uppercase tracking-widest border-b border-[#1F2C4A]/50 pb-1">數據計算說明</div>
                                        <p className="leading-relaxed font-medium mb-2">
                                            此預測基於您 <span className="text-emerald-400">目前持有的真實資產</span> 與其對應的股息殖利率換算。
                                        </p>
                                        <ul className="space-y-1.5 list-disc pl-3 text-white/70">
                                            <li><span className="text-white">基準點</span>：加總所有股票與 RSU 價值 × 殖利率。</li>
                                            <li><span className="text-white">增長率</span>：預設採用 <span className="text-[#22D3EE]">12% 複合年增長率</span>。</li>
                                            <li><span className="text-white">包含項目</span>：資產增值 (7%) + 股息成長與再投入 (5%)。</li>
                                        </ul>
                                        <div className="absolute left-4 -top-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-900"></div>
                                    </div>
                                </div>
                            </h2>
                            <p className="text-xs font-bold text-[#5A6B89] mt-1">基於歷史股息率與再投入策略的 10 年成長模擬</p>
                        </div>
                    </div>

                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planningData.dividendProjections}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '預計年股息']}
                                />
                                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} barSize={34} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#111A2E] rounded-2xl border border-[#1F2C4A]/60 shadow-sm flex items-center gap-3">
                            <div className="bg-[#111A2E] p-1.5 rounded-lg">
                                <Activity className="w-4 h-4 text-[#5A6B89]" />
                            </div>
                            <div>
                                <div className="text-[9px] text-[#5A6B89] font-black uppercase tracking-widest">目前年收</div>
                                <div className="text-lg font-black text-[#E6EDF7]">
                                    ${Number(planningData.dividendProjections[0]?.amount || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-[#111A2E] rounded-2xl border border-[#2E7CF6] shadow-lg shadow-[#2E7CF6]/15 flex items-center gap-3">
                            <div className="bg-[#1F2C4A]/40 p-1.5 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="text-[9px] text-white/70 font-black uppercase tracking-widest">
                                    {planningData.dividendProjections[planningData.dividendProjections.length - 1]?.year} 預計
                                </div>
                                <div className="text-lg font-black text-white">
                                    ${Number(planningData.dividendProjections[planningData.dividendProjections.length - 1]?.amount || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Analysis & Management Section (Hybrid: Desktop 3-Column / Mobile Dropdown) */}
            <div className="grid grid-cols-12 gap-6 h-auto lg:h-[800px] mb-6 relative">

                {/* A. Asset List (Desktop Only Sidebar - Hidden on Mobile) */}
                <div className="hidden lg:flex lg:col-span-2 glass rounded-3xl border border-[#1F2C4A] shadow-xl overflow-hidden flex-col">
                    <div className="p-4 border-b border-[#1F2C4A]/60 bg-[#16223D]/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[#E6EDF7] uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3 text-[#2E7CF6]" />
                                持股清單
                            </h2>
                            <span className="text-[9px] font-bold text-[#5A6B89]">
                                {planningData.availableStocks?.length || 0}
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="w-3 h-3 text-[#5A6B89] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#16223D] border border-[#1F2C4A] rounded-lg py-1.5 pl-7 pr-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-[#2E7CF6] transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                        {planningData.availableStocks
                            ?.filter((s: any) => {
                                const matchesSearch = (s.symbol || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase());
                                return matchesSearch;
                            })
                            .map((stock: any) => {
                                const target = planningData.strategyTargets.find((t: any) => t.category === stock.currentCategory);
                                const categoryColor = target?.color || "#94a3b8";

                                return (
                                    <button
                                        key={stock.id}
                                        onClick={() => stock.symbol && setSelectedStock(stock.symbol)}
                                        className={`w-full p-2 rounded-xl transition-all border flex flex-col gap-1 group relative overflow-hidden ${selectedStock === stock.symbol
                                            ? 'bg-[#16223D] border-[#2E7CF6]/40 shadow-md'
                                            : 'bg-transparent border-transparent hover:bg-[#16223D]/60 hover:border-[#1F2C4A]/60'
                                            } ${!stock.symbol ? 'opacity-70 grayscale' : ''}`}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: categoryColor }}></div>
                                        <div className="text-[10px] font-black text-[#E6EDF7] truncate">{stock.symbol || 'N/A'}</div>
                                        <div className="text-[8px] font-bold text-[#5A6B89] truncate opacity-70 italic">{stock.name}</div>
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* B. Deep Technical Analysis (Expanded: Flexible Span) */}
                <div className="col-span-12 lg:col-span-7 glass rounded-3xl border border-[#1F2C4A] shadow-2xl overflow-hidden flex flex-col bg-[#111A2E] transition-all duration-500">
                    <div className="px-4 sm:px-5 py-3 border-b border-[#1F2C4A]/60 bg-[#16223D]/30 flex flex-col lg:flex-row justify-between lg:items-center gap-4 transition-all">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="bg-[#111A2E] p-2 rounded-xl shadow-lg shadow-[#2E7CF6]/10 hidden sm:block">
                                <Globe className="w-4 h-4 text-white" />
                            </div>

                            {/* Mobile Only Selector */}
                            <div className="relative flex-1 max-w-xs group lg:hidden">
                                <select
                                    value={selectedStock || ""}
                                    onChange={(e) => setSelectedStock(e.target.value)}
                                    className="w-full bg-[#16223D] border border-[#1F2C4A] rounded-xl py-2 pl-4 pr-10 text-sm font-black text-[#E6EDF7] appearance-none focus:ring-4 focus:ring-[#2E7CF6]/10 focus:border-[#2E7CF6] outline-none cursor-pointer transition-all shadow-sm group-hover:border-[#2E7CF6]/60"
                                >
                                    {planningData.availableStocks?.map((stock: any) => (
                                        <option key={stock.id} value={stock.symbol}>
                                            {stock.symbol} - {stock.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-[#5A6B89] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2E7CF6] transition-colors" />
                            </div>

                            <div className="h-8 w-px bg-[#1F2C4A] hidden lg:block"></div>

                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]/100 animate-pulse"></div>
                                <h2 className="text-[10px] font-black text-[#93A4C2] uppercase tracking-widest flex items-center gap-2">
                                    即時分析 <span className="text-[#2E7CF6] font-black">{selectedStock || '需選取標的'}</span>
                                </h2>
                            </div>
                        </div>

                        {selectedAsset && (
                            <div className="flex items-center flex-wrap gap-2 lg:gap-4 w-full lg:w-auto justify-end">
                                <div className="flex items-center gap-2 bg-[#111A2E] px-3 py-1.5 rounded-xl border border-[#1F2C4A]/60 shadow-sm">
                                    <span className="text-[8px] font-black text-[#5A6B89] uppercase tracking-widest">策略類別</span>
                                    <select
                                        value={selectedAsset.currentCategory || ""}
                                        onChange={(e) => handleCategoryChange(selectedAsset.id, e.target.value)}
                                        className="bg-transparent text-[10px] font-black text-[#E6EDF7] outline-none cursor-pointer"
                                    >
                                        <option value="">未分類</option>
                                        {planningData.strategyTargets.map((t: any) => (
                                            <option key={t.category} value={t.category}>{t.category}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedAsset.recommendedCategory && selectedAsset.currentCategory !== selectedAsset.recommendedCategory && (
                                        <button
                                            onClick={() => handleCategoryChange(selectedAsset.id, selectedAsset.recommendedCategory)}
                                            className="bg-[#111A2E] text-[#2E7CF6] border border-[#1F2C4A] px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1 hover:bg-[#16223D] transition-all shadow-sm"
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            採納建議
                                        </button>
                                    )}

                                    {selectedStock && (
                                        <a
                                            href={`https://www.tradingview.com/chart/?symbol=${selectedStock.replace('TPE:', 'TWSE:')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-[#16223D] hover:bg-[#1F2C4A] rounded-xl text-[#93A4C2] transition-all border border-[#1F2C4A] shadow-sm"
                                            title="外部開啟"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative h-[600px] lg:h-full min-h-[600px] lg:min-h-[500px]">
                        {selectedStock ? (
                            <TradingViewChart key={selectedStock} symbol={selectedStock} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#5A6B89] space-y-3 p-8 text-center bg-[#16223D]/20">
                                <div className="w-12 h-12 rounded-2xl bg-[#16223D] flex items-center justify-center">
                                    <Target className="w-6 h-6 opacity-20" />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-[#93A4C2]">等待選取標的</p>
                                    <p className="text-[10px] font-bold text-[#5A6B89]">請從上方清單選擇股票以載入 K 線圖</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* C. Strategy Notes (Always Open) */}
                <div className="col-span-12 lg:col-span-3 glass rounded-3xl border border-[#1F2C4A] shadow-xl p-6 flex flex-col bg-[#16223D]/40 backdrop-blur-xl overflow-hidden transition-all duration-300">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-[#111A2E] p-1.5 rounded-lg shadow-lg shadow-[#2E7CF6]/15">
                                <PenLine className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-[#E6EDF7] leading-tight">戰術筆記</h2>
                                <p className="text-[9px] font-bold text-[#5A6B89] uppercase tracking-tighter">{selectedStock || '備註'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                        {selectedStock ? (
                            <StockPlanningNotes symbol={selectedStock} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#5A6B89] italic text-xs space-y-2 opacity-60">
                                <div className="w-1 h-12 bg-[#1F2C4A] rounded-full"></div>
                                <p>等待標的選取...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
