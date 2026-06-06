"use client";

import React from "react";
import { TrendChartItem } from "@/types/dashboard";

interface TrendChartProps {
    trendData: TrendChartItem[];
    activeSnapshotId: string | null;
    setActiveSnapshotId: (id: string) => void;
    hasFilters: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    trendData,
    activeSnapshotId,
    setActiveSnapshotId,
    hasFilters
}) => {
    const maxAsset = trendData.reduce((max, current) => Math.max(max, current.fullAssets || 0), 0);
    const chartMax = Math.max(maxAsset * 1.2, 100);

    return (
        <div className="glass-card rounded-3xl p-6 flex flex-col h-full">
            <h3 className="text-sm font-bold text-[#93A4C2] mb-6 text-center flex items-center justify-center gap-2 uppercase tracking-wider">
                📈 總資產成長趨勢（等值 NTD）
            </h3>
            <div className="h-[250px] w-full flex flex-col items-center justify-end relative">
                <div className="flex w-full justify-around items-end h-[150px] px-8 border-b border-[#1F2C4A] pb-0 gap-2">
                    {trendData.map((item) => {
                        const isSelected = activeSnapshotId === item.id;
                        const fullHeight = Math.max((item.fullAssets / chartMax) * 100, 2);
                        const filteredHeight = Math.max((item.filteredAssets / chartMax) * 100, 2);
                        const showStack = hasFilters && (item.filteredAssets !== undefined);

                        return (
                            <div
                                key={item.id}
                                className="flex flex-col items-center flex-1 group h-full justify-end cursor-pointer relative"
                                onClick={() => setActiveSnapshotId(item.id)}
                            >
                                <div className="absolute -top-8 flex flex-col items-center">
                                    {showStack && item.filteredAssets < item.fullAssets && (
                                        <span className="text-[10px] text-[#5A6B89] font-bold leading-none mb-0.5">{item.fullAssets}萬</span>
                                    )}
                                    <span className={`text-xs font-black z-10 tabnum ${isSelected ? 'text-[#2E7CF6]' : 'text-[#93A4C2] opacity-60 group-hover:opacity-100 transition-all'}`}>
                                        {item.filteredAssets}萬
                                    </span>
                                </div>

                                <div className="w-full relative h-full flex items-end justify-center">
                                    {showStack && (
                                        <div
                                            className="absolute w-full bg-[#16223D] rounded-t-lg transition-all"
                                            style={{ height: `${fullHeight}%` }}
                                        ></div>
                                    )}

                                    <div
                                        className={`w-full rounded-t-lg transition-all border-b-0 border-white/10 border-x z-10 ${isSelected ? 'opacity-100 ring-2 ring-[#2E7CF6] ring-offset-2 ring-offset-[#0B1220]' : 'opacity-70 group-hover:opacity-100'}`}
                                        style={{
                                            height: `${filteredHeight}%`,
                                            backgroundColor: item.color
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex w-full justify-around mt-3 px-8 gap-2">
                    {trendData.map((item) => (
                        <div
                            key={item.id}
                            className={`text-[10px] md:text-sm font-bold text-center flex-1 cursor-pointer transition-colors ${activeSnapshotId === item.id ? 'text-[#2E7CF6]' : 'text-[#5A6B89] hover:text-[#93A4C2]'}`}
                            onClick={() => setActiveSnapshotId(item.id)}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>

                <div className="text-[#10B981] font-black text-lg mt-4 flex items-center gap-1">
                    <span className="text-xs">▲</span> +80.9%
                </div>
            </div>
        </div>
    );
};
