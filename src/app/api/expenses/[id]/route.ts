import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const r = await supabaseAdmin.from("expenses").update(body).eq("id", id).select().single();
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
    return NextResponse.json({ data: r.data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    if (!HAS_SECRET) return NextResponse.json({ error: "SECRET 未設定" }, { status: 503 });
    const { id } = await ctx.params;
    const r = await supabaseAdmin.from("expenses").delete().eq("id", id);
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
