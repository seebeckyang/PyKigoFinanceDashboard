// /api/cron/subscription-renewals — JSON 大法版
// 走 jsonStore 撈訂閱,把續費警示寫到 snapshots(period_name="renewals:YYYY-MM-DD")

import { NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "@/lib/supabaseAdmin";
import * as J from "@/lib/jsonStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });

    const subs = await J.listAll("subscription").catch(() => []);

    const now = new Date();
    const alerts: any[] = [];
    for (const s of subs) {
        if (!s.next_charge_at) continue;
        if (s.planned_cancel) continue;
        const due = new Date(s.next_charge_at);
        const days = Math.ceil((due.getTime() - now.getTime()) / 86400_000);
        let level: "info" | "warning" | null = null;
        if (days >= 0 && days <= 7) level = "warning";
        else if (days > 7 && days <= 30) level = "info";
        if (!level) continue;
        alerts.push({
            service: s.service_name, amount: s.amount, currency: s.currency,
            cycle: s.cycle, due_at: s.next_charge_at, days_until: days, level,
        });
    }

    if (alerts.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const summary = alerts.map(a =>
            `${a.level === "warning" ? "🔥" : "📅"} ${a.service} 將於 ${a.days_until} 天後續扣 ${a.amount} ${a.currency}`
        ).join("\n");
        await supabaseAdmin.from("snapshots").upsert({
            period_name: `renewals:${today}`,
            ai_summary: summary,
            notes: JSON.stringify({ alerts }),
        }, { onConflict: "period_name" });
    }

    return NextResponse.json({ ok: true, total: subs.length, alerts });
}
