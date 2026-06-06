"use client";

import React from "react";
import { Sparkles, Send } from "lucide-react";

interface AIInsightSectionProps {
    latestSummary: string;
    feedbackText: string;
    setFeedbackText: (text: string) => void;
    handleRegenerate: () => void;
    isRegenerating: boolean;
}

export const AIInsightSection: React.FC<AIInsightSectionProps> = ({
    latestSummary,
    feedbackText,
    setFeedbackText,
    handleRegenerate,
    isRegenerating
}) => {
    const isLoading = latestSummary.includes('正在為您產生') || latestSummary.includes('載入最新的財務數據');

    return (
        <div className="glass-card rounded-2xl p-5 flex items-start gap-4 border border-[#1F2C4A]" style={{background:'linear-gradient(135deg, rgba(46,124,246,0.08) 0%, rgba(34,211,238,0.05) 100%)'}}>
            <div className="bg-[#16223D] p-2 rounded-xl shadow-sm text-[#2E7CF6] mt-1 border border-[#1F2C4A]">
                <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 w-full">
                <h3 className="font-bold text-[#E6EDF7] flex items-center gap-2">
                    AI 財務洞察摘要
                </h3>
                <p className="text-[#93A4C2] text-sm mt-1 leading-relaxed whitespace-pre-line min-h-[40px]">
                    {latestSummary}
                </p>
                <div className="mt-3 flex gap-2 relative">
                    <input
                        type="text"
                        placeholder="給 AI 一些建議，例如：請短一點、多關注股票..."
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#1F2C4A] bg-[#16223D] shadow-sm flex-1 outline-none focus:ring-2 focus:ring-[#2E7CF6] transition-all text-[#E6EDF7] placeholder-[#5A6B89]"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                        disabled={isRegenerating || isLoading}
                    />
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating || !feedbackText.trim() || isLoading}
                        className="bg-[#2E7CF6] hover:bg-[#1a6ae3] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRegenerating ? <span className="animate-pulse text-xs">生成中...</span> : <><Send className="w-3 h-3" /> 重新生成</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
