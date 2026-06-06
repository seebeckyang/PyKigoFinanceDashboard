"use client";

import { useMemo } from "react";
import { Repeat, CalendarClock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { REAL_DATA } from "@/lib/realData";

const fmt = (n: number) => "NT$ " + Math.round(n).toLocaleString();

export default function SubscriptionsPage() {
    const subs = REAL_DATA.subscriptions as any[];
    const monthlyTotal = REAL_DATA.subscriptionsMonthlyTotal;
    const reminders = REAL_DATA.renewalReminders as any[];

    const { monthly, yearly } = useMemo(() => {
        return {
            monthly: subs.filter((s) => s.cycle === "monthly").sort((a, b) => b.monthly_twd - a.monthly_twd),
            yearly: subs.filter((s) => s.cycle === "yearly").sort((a, b) => b.monthly_twd - a.monthly_twd),
        };
    }, [subs]);

    const yearlyEquivMonthly = yearly.reduce((s, x) => s + x.monthly_twd, 0);
    const monthlySum = monthly.reduce((s, x) => s + x.monthly_twd, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#E6EDF7] tracking-tight flex items-center gap-2">
                    <Repeat className="w-6 h-6 text-[#2E7CF6]" />
                    訂閱與固定支出
                </h1>
                <p className="text-[#93A4C2] mt-1 text-sm font-medium">{subs.length} 筆訂閱服務 · 年付以「月攤提」等值換算</p>
            </div>

            {/* 月固定支出 Hero */}
            <div className="rounded-3xl p-6 sm:p-8 border border-[#1F2C4A] shadow-lg relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111A2E 0%, #16223D 60%, #0E1A33 100%)" }}>
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 70%)" }} />
                <div className="relative">
                    <div className="text-xs font-semibold text-[#93A4C2] uppercase tracking-widest">每月固定訂閱支出（含年付月攤）</div>
                    <div className="text-4xl sm:text-5xl font-black mt-2 text-[#E6EDF7] tabnum">{fmt(monthlyTotal)}</div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-[#93A4C2]">
                        <span>月付小計 <b className="text-[#22D3EE]">{fmt(monthlySum)}</b>（{monthly.length} 筆）</span>
                        <span>年付月攤 <b className="text-[#F59E0B]">{fmt(yearlyEquivMonthly)}</b>（{yearly.length} 筆）</span>
                        <span>年化總額 <b className="text-[#E6EDF7]">{fmt(monthlyTotal * 12)}</b></span>
                    </div>
                </div>
            </div>

            {/* 訂閱清單 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubTable title="月付訂閱" rows={monthly} accent="#22D3EE" />
                <SubTable title="年付訂閱（月攤提）" rows={yearly} accent="#F59E0B" />
            </div>

            {/* 年付續費提醒 */}
            <div className="glass-card rounded-3xl p-6">
                <h3 className="text-sm font-bold text-[#93A4C2] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[#2E7CF6]" /> 年付續費提醒
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {reminders.map((r) => {
                        const cancel = r.will_cancel;
                        const undecided = (r.planned_action || "").includes("待決定");
                        const Icon = cancel ? XCircle : undecided ? AlertTriangle : CheckCircle2;
                        const color = cancel ? "#EF4444" : undecided ? "#F59E0B" : "#10B981";
                        return (
                            <div key={r.name} className="bg-[#0E1A33] border border-[#1F2C4A] rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#E6EDF7]">{r.name}</span>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                                <div className="text-[11px] text-[#93A4C2] mt-1">下次扣款 {r.next_billing} · {r.amount}</div>
                                <div className="text-[11px] text-[#5A6B89] mt-0.5">月攤 {fmt(r.monthly_twd)}</div>
                                <div className="text-xs mt-2 font-medium" style={{ color }}>{r.planned_action}</div>
                                <div className="text-[10px] text-[#5A6B89] mt-1">提醒：{r.remind_1month}（1個月前）· {r.remind_1week}（1週前）</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SubTable({ title, rows, accent }: { title: string; rows: any[]; accent: string }) {
    return (
        <div className="glass-card rounded-3xl p-6 overflow-hidden">
            <h3 className="text-sm font-bold text-[#93A4C2] mb-3 uppercase tracking-wider">{title}（{rows.length}）</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-[#5A6B89] border-b border-[#1F2C4A]">
                            <th className="py-2 pr-2">服務</th>
                            <th className="py-2 pr-2 text-right">原始費用</th>
                            <th className="py-2 pr-2 text-right">月等值</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((s) => (
                            <tr key={s.name} className="border-b border-[#1F2C4A]/50 hover:bg-[#16223D]/60 transition-colors">
                                <td className="py-2.5 pr-2">
                                    <div className="font-semibold text-[#E6EDF7] flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
                                        {s.name}
                                    </div>
                                    <div className="text-[11px] text-[#5A6B89]">
                                        {s.cycle === "monthly" ? `每月 ${s.billing_day} 日扣款` : `年付 · 下次 ${s.next_billing}`}
                                    </div>
                                </td>
                                <td className="py-2.5 pr-2 text-right text-[#93A4C2] tabnum">{s.fee.toLocaleString()} {s.currency}</td>
                                <td className="py-2.5 pr-2 text-right font-mono text-[#E6EDF7] tabnum">NT$ {s.monthly_twd.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
