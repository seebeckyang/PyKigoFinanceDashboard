"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { getLatestDashboardData } from "@/app/actions/dashboard";
import { generateLiveAISummary } from "@/app/actions/ai";
import { DashboardData } from "@/types/dashboard";

// Sub-components
import { AIInsightSection } from "@/components/dashboard/AIInsightSection";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AggregationPieCharts } from "@/components/dashboard/AggregationPieCharts";
import { LiveMarketTicker } from "@/components/dashboard/LiveMarketTicker";

// 戰情室常用追蹤標的（之後可由 assets 表帶入）
const DASHBOARD_TICKERS = ["NVDA", "GOOGL", "TSM", "AAPL", "MSFT", "VOO", "O", "SCHD"];

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const [latestSummary, setLatestSummary] = useState<string>("正在載入最新的財務數據中...");
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ currency?: string, type?: string, owner?: string }>({});

    useEffect(() => {
        setMounted(true);

        const loadDashboard = async () => {
            try {
                const data = await getLatestDashboardData() as DashboardData;
                setDashboardData(data);
                if (data.latestSnapshot) {
                    setActiveSnapshotId(data.latestSnapshot.id);

                    // If summary exists in snapshot, use it immediately (UX optimization)
                    if (data.latestSnapshot.ai_summary) {
                        setLatestSummary(data.latestSnapshot.ai_summary);
                        return;
                    }
                }

                setLatestSummary("✨ 正在為您產生即時 AI 財務洞察中...");
                const liveSummary = await generateLiveAISummary(data);
                setLatestSummary(liveSummary);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setLatestSummary("⚠️ 無法載入財務數據。");
            }
        };

        loadDashboard();
    }, []);

    const handleRegenerate = async () => {
        if (!dashboardData || !feedbackText.trim() || isRegenerating) return;

        setIsRegenerating(true);
        setLatestSummary("✨ 正在依據您的回饋重新產生洞察中...");

        try {
            const newSummary = await generateLiveAISummary(dashboardData, feedbackText.trim());
            setLatestSummary(newSummary);
            setFeedbackText("");
        } catch (error) {
            console.error("Failed to regenerate summary", error);
            setLatestSummary("⚠️ 重新產生失敗，請稍後再試。");
        } finally {
            setIsRegenerating(false);
        }
    };

    const toggleFilter = (key: 'currency' | 'type' | 'owner', value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (newFilters[key] === value) delete newFilters[key];
            else newFilters[key] = value;
            return newFilters;
        });
    };

    const displayData = useMemo(() => {
        if (!dashboardData || !activeSnapshotId) return dashboardData;

        const snapshotDetail = dashboardData.snapshotDetails[activeSnapshotId];
        if (!snapshotDetail || !snapshotDetail.rawRecords) return dashboardData;

        let records = snapshotDetail.rawRecords;

        if (activeFilters.currency) records = records.filter((r: any) => r.assets?.currency === activeFilters.currency);
        if (activeFilters.type) records = records.filter((r: any) => r.assets?.asset_type === activeFilters.type);
        if (activeFilters.owner) records = records.filter((r: any) => r.assets?.owner === activeFilters.owner);

        let totalValueFiltered = 0;
        const currencyMap: Record<string, number> = {};
        const allocationMap: Record<string, number> = {};
        const ownershipMap: Record<string, number> = {};

        records.forEach((record: any) => {
            const val = Number(record.total_twd_value) || 0;
            totalValueFiltered += val;

            const asset = Array.isArray(record.assets) ? record.assets[0] : record.assets;
            if (asset) {
                currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + val;
                allocationMap[asset.asset_type] = (allocationMap[asset.asset_type] || 0) + val;
                ownershipMap[asset.owner] = (ownershipMap[asset.owner] || 0) + val;
            }
        });

        const formatPieData = (map: Record<string, number>, colorMap: Record<string, string>) => {
            return Object.entries(map).map(([name, value]) => ({
                name,
                value: totalValueFiltered > 0 ? Number((value / totalValueFiltered * 100).toFixed(1)) : 0,
                raw_value: value,
                color: colorMap[name] || "#CBD5E1",
                originalKey: name
            })).sort((a, b) => b.value - a.value);
        };

        const trendData = Object.entries(dashboardData.snapshotDetails).map(([id, detail]: [string, any]) => {
            const allSnapRecords = detail.rawRecords || [];
            let filteredRecords = allSnapRecords;

            if (activeFilters.currency) filteredRecords = filteredRecords.filter((r: any) => r.assets?.currency === activeFilters.currency);
            if (activeFilters.type) filteredRecords = filteredRecords.filter((r: any) => r.assets?.asset_type === activeFilters.type);
            if (activeFilters.owner) filteredRecords = filteredRecords.filter((r: any) => r.assets?.owner === activeFilters.owner);

            const filteredValue = filteredRecords.reduce((sum: number, r: any) => sum + (Number(r.total_twd_value) || 0), 0);
            const totalValue = allSnapRecords.reduce((sum: number, r: any) => sum + (Number(r.total_twd_value) || 0), 0);

            return {
                id,
                name: detail.period_name,
                fullAssets: Math.round(totalValue / 10000),
                filteredAssets: Math.round(filteredValue / 10000),
                color: id === activeSnapshotId ? "#22c55e" : "#94a3b8"
            };
        }).sort((a: any, b: any) => {
            const indexA = dashboardData.trendData.findIndex((t: any) => t.id === a.id);
            const indexB = dashboardData.trendData.findIndex((t: any) => t.id === b.id);
            return indexA - indexB;
        });

        return {
            ...snapshotDetail,
            totalNetWorth: totalValueFiltered,
            trendData,
            currencyData: formatPieData(currencyMap, { USD: "#F59E0B", TWD: "#2E7CF6", JPY: "#EF4444" }),
            allocationData: formatPieData(allocationMap, { cash: "#2E7CF6", stock: "#A855F7", fixed_deposit: "#F59E0B", rsu: "#10B981" }),
            ownershipData: formatPieData(ownershipMap, { CY: "#10B981", HY: "#22D3EE", Both: "#6366F1" })
        };
    }, [dashboardData, activeSnapshotId, activeFilters]);

    if (!mounted) return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-[#111A2E] rounded-2xl w-full"></div></div>;

    const hasFilters = Object.keys(activeFilters).length > 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#E6EDF7] tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#2E7CF6]" />
                    家庭財務戰情室
                </h1>
                <p className="text-[#93A4C2] mt-1 text-sm font-medium">包含自動化財務洞察與多維度資產解析</p>
            </div>

            {/* 總資產淨值 Hero */}
            <div className="rounded-3xl p-6 sm:p-8 border border-[#1F2C4A] shadow-lg relative overflow-hidden" style={{background:'linear-gradient(135deg, #111A2E 0%, #16223D 60%, #0E1A33 100%)'}}>
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-30" style={{background:'radial-gradient(circle, #2E7CF6 0%, transparent 70%)'}} />
                <div className="relative">
                    <div className="text-xs font-semibold text-[#93A4C2] uppercase tracking-widest">家庭總資產淨值（等值 NTD · 2026/02）</div>
                    <div className="text-4xl sm:text-5xl font-black mt-2 text-[#E6EDF7] tabnum">
                        NT$ {(dashboardData?.grandTotal ?? dashboardData?.totalNetWorth ?? 0).toLocaleString()}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-[#93A4C2]">
                        <span>股票部位 <b className="text-[#22D3EE]">NT$ {(dashboardData?.stockTotal ?? 0).toLocaleString()}</b></span>
                        <span>持股 <b className="text-[#E6EDF7]">{dashboardData?.rawRecords?.filter((r:any)=>r.assets?.ticker_symbol).length ?? 26} 檔</b></span>
                        <span>帳戶 <b className="text-[#E6EDF7]">15 個</b></span>
                    </div>
                </div>
            </div>

            {/* 集中度示警 */}
            {dashboardData?.concentrationAlerts?.length > 0 && (
                <div className="glass-card rounded-3xl p-5 border border-[#3A2E16]" style={{background:'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(17,26,46,0.6))'}}>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#F59E0B] mb-3">
                        <span>⚠️ 集中度示警</span>
                        <span className="text-[11px] font-medium text-[#93A4C2]">單一標的佔總資產比重（🟡≥10% 🟠≥15% 🔴≥20%）</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {dashboardData.concentrationAlerts.map((a:any) => (
                            <div key={a.symbol} className="flex items-center gap-2 bg-[#0E1A33] border border-[#1F2C4A] rounded-xl px-3 py-2">
                                <span className="text-lg">{a.light}</span>
                                <div>
                                    <div className="text-sm font-bold text-[#E6EDF7]">{a.symbol} <span className="text-[11px] font-normal text-[#5A6B89]">{a.name}</span></div>
                                    <div className="text-[11px] text-[#93A4C2]">佔總資產 <b className="text-[#F59E0B]">{a.pctOfTotal}%</b></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 即時市場行情（每 60 秒輪詢） */}
            <LiveMarketTicker tickers={DASHBOARD_TICKERS} />

            {/* AI Insights Section */}
            <AIInsightSection
                latestSummary={latestSummary}
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
                handleRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
            />

            {/* Filter Banner */}
            {hasFilters && (
                <div className="sticky top-16 z-30 flex items-center gap-3 bg-[#16223D]/95 backdrop-blur-sm text-[#22D3EE] px-4 py-3 rounded-xl border border-[#1F2C4A] text-sm font-medium animate-in fade-in shadow-sm md:static md:z-auto">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse"></span>
                        <span className="hidden xs:inline">依點擊互動篩選中：</span>
                        <span className="xs:hidden">篩選中:</span>
                    </span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {activeFilters.currency && <span className="bg-[#111A2E] text-[#E6EDF7] px-2 py-1 rounded shadow-sm whitespace-nowrap">幣別: {activeFilters.currency}</span>}
                        {activeFilters.type && <span className="bg-[#111A2E] text-[#E6EDF7] px-2 py-1 rounded shadow-sm whitespace-nowrap">資產: {activeFilters.type === 'fixed_deposit' ? '定存' : activeFilters.type}</span>}
                        {activeFilters.owner && <span className="bg-[#111A2E] text-[#E6EDF7] px-2 py-1 rounded shadow-sm whitespace-nowrap">成員: {activeFilters.owner}</span>}
                    </div>
                    <button onClick={() => setActiveFilters({})} className="ml-auto flex items-center gap-1 bg-[#111A2E] hover:bg-[#16223D] px-3 py-1 rounded shadow-sm text-[#93A4C2] transition-colors shrink-0">
                        <XCircle className="w-4 h-4" /> 清除
                    </button>
                </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Trend Chart */}
                <TrendChart
                    trendData={displayData?.trendData || []}
                    activeSnapshotId={activeSnapshotId}
                    setActiveSnapshotId={setActiveSnapshotId}
                    hasFilters={hasFilters}
                />

                {/* 資產配置（核心/成長/定存/投機） */}
                <div className="glass-card rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[#93A4C2] mb-2 uppercase tracking-wider">資產配置（策略分類）</h3>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={(dashboardData?.strategyAllocationData||[])} cx="50%" cy="50%" innerRadius={62} outerRadius={108} dataKey="value" nameKey="name" stroke="#0B1220" strokeWidth={2} paddingAngle={1}>
                                    {(dashboardData?.strategyAllocationData||[]).map((e:any,i:number)=>(<Cell key={i} fill={e.color} />))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ background: '#111A2E', border: '1px solid #1F2C4A', borderRadius: '8px', color: '#E6EDF7' }} formatter={(value:any,name:any,props:any)=>[`${value}% (NT$ ${props.payload.raw_value.toLocaleString()})`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                        {(dashboardData?.strategyAllocationData||[]).map((e:any)=>(
                            <span key={e.name} className="text-[11px] text-[#93A4C2] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{background:e.color}} />{e.name} ({e.value}%)</span>
                        ))}
                    </div>
                </div>

                {/* Pie Charts */}
                <AggregationPieCharts
                    currencyData={displayData?.currencyData || []}
                    allocationData={displayData?.allocationData || []}
                    ownershipData={displayData?.ownershipData || []}
                    activeFilters={activeFilters}
                    toggleFilter={toggleFilter}
                />
            </div>
        </div>
    );
}
