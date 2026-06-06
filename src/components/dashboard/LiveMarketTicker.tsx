"use client";

import React from "react";
import { RefreshCw, TrendingUp, TrendingDown, Globe2, Clock } from "lucide-react";
import { useLiveMarket } from "@/hooks/useLiveMarket";

interface LiveMarketTickerProps {
    tickers: string[];
    fxPairs?: string[];
    title?: string;
}

function timeAgo(d: Date | null): string {
    if (!d) return "—";
    return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function LiveMarketTicker({ tickers, fxPairs = ["USD", "JPY", "CNY", "HKD", "EUR"], title = "即時市場行情" }: LiveMarketTickerProps) {
    const { quotes, fx, lastUpdated, isRefreshing, refresh } = useLiveMarket(tickers, 60000);

    const fxDisplay = fx
        ? fxPairs
              .filter((c) => c !== "TWD")
              .map((c) => {
                  const twdPerUsd = fx.rates.TWD || 0;
                  const curPerUsd = fx.rates[c];
                  if (!twdPerUsd || !curPerUsd) return null;
                  const twdPerCur = twdPerUsd / curPerUsd;
                  return { pair: `${c}/TWD`, value: twdPerCur };
              })
              .filter(Boolean)
        : [];

    return (
        <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#E6EDF7] flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#22D3EE]" />
                    {title}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#5A6B89] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        上次更新 {timeAgo(lastUpdated)}
                    </span>
                    <button
                        onClick={refresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1 text-xs font-medium text-[#2E7CF6] hover:text-[#22D3EE] bg-[#16223D] hover:bg-[#1F2C4A] px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-[#1F2C4A]"
                        title="重新整理即時報價"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                        重新整理
                    </button>
                </div>
            </div>

            {/* 股價 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {quotes.length === 0 && (
                    <div className="col-span-full text-center text-xs text-[#5A6B89] py-4">預覽（Demo）模式：市值以最近快照計算，即時報價需連接市場資料源。</div>
                )}
                {quotes.map((q) => {
                    const up = q.changePercent >= 0;
                    return (
                        <div key={q.symbol} className="rounded-xl border border-[#1F2C4A] bg-[#16223D]/60 px-3 py-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#E6EDF7]">{q.symbol}</span>
                                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${up ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {up ? "+" : ""}
                                    {q.changePercent}%
                                </span>
                            </div>
                            <div className="text-base font-black text-[#E6EDF7] mt-0.5 tabnum">
                                {q.price != null ? q.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                                <span className="text-[10px] font-medium text-[#5A6B89] ml-1">{q.currency}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 匯率 */}
            {fxDisplay.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1F2C4A] flex flex-wrap gap-x-4 gap-y-1.5">
                    {fxDisplay.map((f: any) => (
                        <span key={f.pair} className="text-xs text-[#5A6B89]">
                            <span className="font-semibold text-[#93A4C2]">{f.pair}</span>{" "}
                            <span className="font-mono text-[#E6EDF7] tabnum">{f.value.toFixed(f.value < 1 ? 4 : 3)}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
