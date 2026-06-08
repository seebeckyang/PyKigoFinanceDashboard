// /api/expenses — list + create
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });
    const sp = req.nextUrl.searchParams;
    const limit = Number(sp.get("limit") ?? 200);
    const r = await supabaseAdmin.from("expenses").select("*").order("date", { ascending: false }).limit(limit);
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
    return NextResponse.json({ data: r.data ?? [] });
}

export async function POST(req: NextRequest) {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });
    const body = await req.json().catch(() => ({}));

    // 兼容 quick-expense 的欄位名(merchant / occurred_at / category) → 對應 DB 欄位
    const payload: any = {
        date: body.occurred_at || body.date || new Date().toISOString().slice(0, 10),
        store_name: body.merchant || body.store_name || null,
        amount: Number(body.amount) || 0,
        currency: body.currency || "TWD",
        category_id: body.category_id || null,
        project_label: body.project_label || "general",
        paid_by: body.paid_by || "CY",
        paid_for: body.paid_for || "CY",
        is_reviewed: false,
        is_automated: !!body.is_automated,
        metadata: body.metadata || (body.category ? { suggested_category: body.category, note: body.note } : (body.note ? { note: body.note } : null)),
    };

    const r = await supabaseAdmin.from("expenses").insert(payload).select().single();
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
    return NextResponse.json({ data: r.data });
}
