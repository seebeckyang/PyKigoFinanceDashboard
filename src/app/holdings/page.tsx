"use client";

import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { PieChartIcon, RefreshCw, Clock, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { getHoldings, Holding } from "@/app/actions/holdings";
import { useLiveMarket, toTwd } from "@/hooks/useLiveMarket";

// 金融感色票
const PIE_COLORS = [
    "#2E7CF6", "#22D3EE", "#10B981", "#F59E0B", "#A855F7",
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
    "#5A6B89", // 「其他」用暗色
];

interface Row {
    ticker: string;
    name: string;
    owner: string;
    valueTwd: number;
    percent: number;
    unrealizedPct: number | null;
    color: string;
}

function timeLabel(d: Date | null): string {
    if (!d) return "—";
    return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function HoldingsPage() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHoldings().then((h) => {
            setHoldings(h);
            setLoading(false);
        });
    }, []);

    const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings]);
    const { quotes, fx, lastUpdated, isRefreshing, refresh } = useLiveMarket(tickers, 60000);

    const quoteMap = useMemo(() => {
        const m: Record<string, { price: number | null; currency: string }> = {};
        quotes.forEach((q) => (m[q.symbol] = { price: q.price, currency: q.currency }));
        return m;
    }, [quotes]);

    const { rows, totalTwd } = useMemo(() => {
        const computed = holdings.map((h) => {
            const q = quoteMap[h.ticker];
            const livePrice = q && typeof q.price === "number" && !isNaN(q.price) ? q.price : null;
            // 預計真實市值（TWD），無即時報價時直接使用
            const baseTwd = (h as any).valueTwd ?? (h.costPrice * h.shares);
            let valueTwd = baseTwd;
            let unrealizedPct: number | null = null;
            if (livePrice != null) {
                const currency = q?.currency || h.currency;
                const lv = toTwd(livePrice * h.shares, currency, fx);
                if (!isNaN(lv) && lv > 0) {
                    valueTwd = lv;
                    unrealizedPct = h.costPrice > 0 ? ((livePrice - h.costPrice) / h.costPrice) * 100 : null;
                }
            }
            return { ticker: h.ticker, name: h.name, owner: h.owner, valueTwd, unrealizedPct };
        });
        const total = computed.reduce((s, r) => s + r.valueTwd, 0);
        return { rows: computed, totalTwd: total };
    }, [holdings, quoteMap, fx]);

    const { pieData, tableRows } = useMemo(() => {
        const sorted = [...rows].sort((a, b) => b.valueTwd - a.valueTwd);
        const top10 = sorted.slice(0, 10);
        const rest = sorted.slice(10);

        const tableData: Row[] = top10.map((r, i) => ({
            ticker: r.ticker,
            name: r.name,
            owner: r.owner,
            valueTwd: r.valueTwd,
            percent: totalTwd > 0 ? (r.valueTwd / totalTwd) * 100 : 0,
            unrealizedPct: r.unrealizedPct,
            color: PIE_COLORS[i],
        }));

        if (rest.length > 0) {
            const restValue = rest.reduce((s, r) => s + r.valueTwd, 0);
            tableData.push({
                ticker: "其他",
                name: `其餘 ${rest.length} 檔`,
                owner: "—",
                valueTwd: restValue,
                percent: totalTwd > 0 ? (restValue / totalTwd) * 100 : 0,
                unrealizedPct: null,
                color: PIE_COLORS[10],
            });
        }

        const pie = tableData.map((r) => ({ name: r.ticker, value: Number(r.percent.toFixed(1)), raw: r.valueTwd, color: r.color }));
        return { pieData: pie, tableRows: tableData };
    }, [rows, totalTwd]);

    const fmt = (n: number) => "NT$ " + Math.round(n).toLocaleString();

    if (loading) {
        return <div className="p-8 animate-pulse text-[#5A6B89]">正在載入持倉資料中…</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#E6EDF7] tracking-tight flex items-center gap-2">
                        <PieChartIcon className="w-6 h-6 text-[#2E7CF6]" />
                        前十大持倉佔比
                    </h1>
                    <p className="text-[#93A4C2] mt-1 text-sm font-medium">即時市值 = 股數 × 當前報價 × 匯率（換算 TWD）</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#5A6B89] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        上次更新 {timeLabel(lastUpdated)}
                    </span>
                    <button
                        onClick={refresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1 text-xs font-medium text-[#2E7CF6] hover:text-[#22D3EE] bg-[#16223D] hover:bg-[#1F2C4A] px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-[#1F2C4A]"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                        重新整理
                    </button>
                </div>
            </div>

            {/* 總市值卡 */}
            <div className="rounded-3xl p-6 border border-[#1F2C4A] text-white shadow-lg" style={{background:'linear-gradient(135deg, #111A2E 0%, #16223D 100%)'}}>
                <div className="text-xs font-semibold text-[#93A4C2] uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#22D3EE]" /> 股票部位總市值（即時）
                </div>
                <div className="text-3xl font-black mt-2 text-[#E6EDF7] tabnum">{fmt(totalTwd)}</div>
                <div className="text-xs text-[#5A6B89] mt-1">共 {holdings.length} 檔個股 / ETF</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* 圓餅圖 */}
                <div className="lg:col-span-2 glass-card rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[#93A4C2] mb-2 text-center uppercase tracking-wider">持倉市值佔比</h3>
                    <div className="h-[320px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" stroke="#0B1220" strokeWidth={2} paddingAngle={1}>
                                    {pieData.map((e, i) => (
                                        <Cell key={i} fill={e.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ background: '#111A2E', border: '1px solid #1F2C4A', borderRadius: '8px', color: '#E6EDF7' }}
                                    formatter={(value: any, name: any, props: any) => [`${value}% (${fmt(props.payload.raw)})`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-[#5A6B89] font-semibold uppercase tracking-wider">前 {Math.min(10, holdings.length)} 大</span>
                            <span className="text-lg font-black text-[#E6EDF7]">{tableRows[0]?.ticker || "—"}</span>
                        </div>
                    </div>
                    {/* 圖例 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-3">
                        {pieData.map((e) => (
                            <span key={e.name} className="text-[11px] text-[#93A4C2] flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                                {e.name} ({e.value}%)
                            </span>
                        ))}
                    </div>
                </div>

                {/* 排名表 */}
                <div className="lg:col-span-3 glass-card rounded-3xl p-6 overflow-hidden">
                    <h3 className="text-sm font-bold text-[#93A4C2] mb-3 uppercase tracking-wider">持倉排名</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5A6B89] border-b border-[#1F2C4A]">
                                    <th className="py-2 pr-2">#</th>
                                    <th className="py-2 pr-2">名稱</th>
                                    <th className="py-2 pr-2 text-right">佔比</th>
                                    <th className="py-2 pr-2 text-right">目前市值</th>
                                    <th className="py-2 pr-2 text-right">未實現損益</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((r, i) => (
                                    <tr key={r.ticker} className="border-b border-[#1F2C4A]/50 hover:bg-[#16223D]/60 transition-colors">
                                        <td className="py-2.5 pr-2">
                                            <span className="w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-bold text-white" style={{ background: r.color }}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="py-2.5 pr-2">
                                            <div className="font-bold text-[#E6EDF7]">{r.ticker}</div>
                                            <div className="text-[11px] text-[#5A6B89]">{r.name}</div>
                                        </td>
                                        <td className="py-2.5 pr-2 text-right font-semibold text-[#E6EDF7] tabnum">{r.percent.toFixed(1)}%</td>
                                        <td className="py-2.5 pr-2 text-right font-mono text-[#E6EDF7] tabnum">{fmt(r.valueTwd)}</td>
                                        <td className="py-2.5 pr-2 text-right">
                                            {r.unrealizedPct == null ? (
                                                <span className="text-[#5A6B89]">—</span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-0.5 font-semibold tabnum ${r.unrealizedPct >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                                                    {r.unrealizedPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {r.unrealizedPct >= 0 ? "+" : ""}
                                                    {r.unrealizedPct.toFixed(1)}%
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[11px] text-[#5A6B89] mt-3">
                        * 未實現損益 = (即時報價 − 平均成本) / 平均成本。「其他」為第 11 名以後合併。
                    </p>
                </div>
            </div>
        </div>
    );
}
