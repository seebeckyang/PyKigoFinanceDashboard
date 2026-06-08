// /api/cron/subscription-renewals
// 每天跑一次,撈出 30 天內 / 7 天內到期的訂閱,寫入 alerts 表(系統內通知)
// 之後可以接 Perplexity push notification

import { NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400_000);
    const in30 = new Date(now.getTime() + 30 * 86400_000);

    const { data: subs, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .not("next_charge_at", "is", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const alerts: any[] = [];
    for (const s of subs ?? []) {
        const due = new Date(s.next_charge_at);
        const days = Math.ceil((due.getTime() - now.getTime()) / 86400_000);
        let level: "info" | "warning" | "danger" | null = null;
        if (days <= 7 && days >= 0) level = "warning";
        else if (days <= 30 && days > 7) level = "info";
        if (!level) continue;
        if (s.planned_cancel) continue;
        alerts.push({
            kind: "subscription_renewal",
            level,
            ref_id: s.id,
            title: `${s.service_name} 將於 ${days} 天後續扣`,
            body: `${s.amount} ${s.currency} (${s.cycle}) · ${s.payment_method || ""}`,
            due_at: s.next_charge_at,
        });
    }

    if (alerts.length > 0) {
        // 寫入 alerts 表(覆寫同 ref_id 的 active 紀錄)
        for (const a of alerts) {
            await supabaseAdmin.from("alerts")
                .upsert({ ...a, status: "active", created_at: new Date().toISOString() }, { onConflict: "ref_id,kind" });
        }
    }

    return NextResponse.json({ ok: true, found: subs?.length ?? 0, alerts_created: alerts.length, alerts });
}
