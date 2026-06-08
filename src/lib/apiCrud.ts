// 通用 CRUD route helper(server only)
// 給 src/app/api/{table}/route.ts + src/app/api/{table}/[id]/route.ts 用

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "./supabaseAdmin";

function unconfigured() {
    return NextResponse.json(
        { error: "SUPABASE_SECRET_KEY 未設定,前往 Vercel 環境變數設定" },
        { status: 503 }
    );
}

export async function listAll(table: string, opts?: { order?: string; ascending?: boolean }) {
    if (!HAS_SECRET) return unconfigured();
    const order = opts?.order ?? "sort_order";
    const ascending = opts?.ascending ?? true;
    const { data, error } = await supabaseAdmin
        .from(table)
        .select("*")
        .order(order, { ascending });
    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
}

export async function createOne(table: string, req: NextRequest) {
    if (!HAS_SECRET) return unconfigured();
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
    const { data, error } = await supabaseAdmin.from(table).insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    return NextResponse.json({ data });
}

export async function updateOne(table: string, id: string, req: NextRequest) {
    if (!HAS_SECRET) return unconfigured();
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
    delete body.id;
    delete body.created_at;
    delete body.updated_at;
    const { data, error } = await supabaseAdmin.from(table).update(body).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    return NextResponse.json({ data });
}

export async function deleteOne(table: string, id: string) {
    if (!HAS_SECRET) return unconfigured();
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    return NextResponse.json({ ok: true });
}
