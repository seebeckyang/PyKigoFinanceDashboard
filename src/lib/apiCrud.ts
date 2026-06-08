// 通用 CRUD route helper(server only)
// 走 JSON 大法:全部資料偽裝成 expenses 表 + project_label="asset:<kind>"
// 不需要任何 DDL

import { NextRequest, NextResponse } from "next/server";
import { HAS_SECRET } from "./supabaseAdmin";
import * as J from "./jsonStore";

function unconfigured() {
    return NextResponse.json(
        { error: "SUPABASE_SECRET_KEY 未設定,前往 Vercel 環境變數設定" },
        { status: 503 }
    );
}

// 複數 → 單數 + jsonStore.Kind
const TABLE_TO_KIND: Record<string, J.Kind> = {
    institutions: "institution",
    accounts: "account",
    holdings: "holding",
    funds: "fund",
    policies: "policy",
    subscriptions: "subscription",
};

function kindOf(table: string): J.Kind {
    const k = TABLE_TO_KIND[table];
    if (!k) throw new Error(`unknown table: ${table}`);
    return k;
}

export async function listAll(table: string, _opts?: { order?: string; ascending?: boolean }) {
    if (!HAS_SECRET) return unconfigured();
    try {
        const data = await J.listAll(kindOf(table));
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function createOne(table: string, req: NextRequest) {
    if (!HAS_SECRET) return unconfigured();
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
    try {
        const data = await J.createOne(kindOf(table), body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function updateOne(table: string, id: string, req: NextRequest) {
    if (!HAS_SECRET) return unconfigured();
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
    delete body.id;
    delete body.created_at;
    delete body.updated_at;
    try {
        const data = await J.updateOne(kindOf(table), id, body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function deleteOne(table: string, id: string) {
    if (!HAS_SECRET) return unconfigured();
    try {
        await J.deleteOne(kindOf(table), id);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
