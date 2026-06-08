// /api/setup
// GET                    → 回傳 schema SQL 字串 + 目前各表存在狀態
// POST { action:"seed" } → 把真實 15 機構 / 帳戶 / 持股 / 基金 / 保單 / 訂閱 塞進 DB
// POST { action:"reset" }→ 全部清空(institutions cascade)

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, HAS_SECRET } from "@/lib/supabaseAdmin";
import { INSTITUTIONS, ACCOUNTS, HOLDINGS, FUNDS, POLICIES, SUBSCRIPTIONS } from "@/lib/seedData";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readSchemaSql(): Promise<string> {
    const f1 = path.join(process.cwd(), "db/migrations/001_bootstrap.sql");
    const f2 = path.join(process.cwd(), "db/migrations/002_core_schema.sql");
    const [a, b] = await Promise.all([fs.readFile(f1, "utf-8"), fs.readFile(f2, "utf-8")]);
    return `-- ─── 一鍵建立家庭財務戰情室 schema ───\n${a}\n\n${b}`;
}

async function tableExists(table: string): Promise<boolean> {
    const r = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    return !r.error;
}

export async function GET() {
    if (!HAS_SECRET) {
        return NextResponse.json({ error: "SUPABASE_SECRET_KEY 未設定" }, { status: 503 });
    }
    const tables = ["institutions", "accounts", "holdings", "funds", "policies", "subscriptions", "daily_snapshots", "alerts"];
    const status: Record<string, boolean> = {};
    for (const t of tables) status[t] = await tableExists(t);
    const schemaSql = await readSchemaSql();
    return NextResponse.json({
        schemaSql,
        tablesExist: status,
        allReady: Object.values(status).every(Boolean),
    });
}

export async function POST(req: NextRequest) {
    if (!HAS_SECRET) return NextResponse.json({ error: "SUPABASE_SECRET_KEY 未設定" }, { status: 503 });
    let body: any = {};
    try { body = await req.json(); } catch { }
    const action = body?.action;

    if (action === "reset") {
        const errs: string[] = [];
        for (const t of ["subscriptions", "policies", "funds", "holdings", "accounts", "institutions"]) {
            const r = await supabaseAdmin.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
            if (r.error) errs.push(`${t}: ${r.error.message}`);
        }
        if (errs.length) return NextResponse.json({ ok: false, errors: errs }, { status: 500 });
        return NextResponse.json({ ok: true, message: "全部清空" });
    }

    if (action === "seed") {
        // 1) institutions
        const { data: instRows, error: e1 } = await supabaseAdmin
            .from("institutions")
            .insert(INSTITUTIONS.map((x, i) => ({ ...x, sort_order: i * 10 })))
            .select();
        if (e1) return NextResponse.json({ step: "institutions", error: e1.message }, { status: 500 });
        const instMap = new Map<string, string>();
        for (const r of instRows!) instMap.set(r.name, r.id);

        // 2) accounts
        const accInserts = ACCOUNTS.map((a, i) => {
            const id = instMap.get(a.inst);
            if (!id) throw new Error(`找不到 institution: ${a.inst}`);
            return { institution_id: id, name: a.name, account_type: a.account_type, currency: a.currency, balance: a.balance, sort_order: i * 10 };
        });
        const { error: e2 } = await supabaseAdmin.from("accounts").insert(accInserts);
        if (e2) return NextResponse.json({ step: "accounts", error: e2.message }, { status: 500 });

        // 3) holdings
        const hInserts = HOLDINGS.map((h, i) => {
            const id = instMap.get(h.inst);
            if (!id) throw new Error(`找不到 institution: ${h.inst}`);
            return {
                institution_id: id, symbol: h.symbol, name: h.name, market: h.market,
                shares: h.shares, market_value: h.market_value, currency: h.currency,
                classification: h.classification, sort_order: i * 10,
            };
        });
        const { error: e3 } = await supabaseAdmin.from("holdings").insert(hInserts);
        if (e3) return NextResponse.json({ step: "holdings", error: e3.message }, { status: 500 });

        // 4) funds
        const fInserts = FUNDS.map((f, i) => {
            const id = instMap.get(f.inst);
            if (!id) throw new Error(`找不到 institution: ${f.inst}`);
            return { institution_id: id, fund_code: f.fund_code, name: f.name, market_value: f.market_value, currency: f.currency, sort_order: i * 10 };
        });
        const { error: e4 } = await supabaseAdmin.from("funds").insert(fInserts);
        if (e4) return NextResponse.json({ step: "funds", error: e4.message }, { status: 500 });

        // 5) policies
        const pInserts = POLICIES.map((p, i) => {
            const id = instMap.get(p.inst);
            if (!id) throw new Error(`找不到 institution: ${p.inst}`);
            return { institution_id: id, policy_name: p.policy_name, policy_type: p.policy_type, current_value: p.current_value, currency: p.currency, sort_order: i * 10 };
        });
        const { error: e5 } = await supabaseAdmin.from("policies").insert(pInserts);
        if (e5) return NextResponse.json({ step: "policies", error: e5.message }, { status: 500 });

        // 6) subscriptions
        const sInserts = SUBSCRIPTIONS.map(s => ({
            service_name: s.service_name, amount: s.amount, currency: s.currency, cycle: s.cycle,
            payment_method: s.payment_method, category: s.category, planned_cancel: s.planned_cancel ?? false, note: s.note,
        }));
        const { error: e6 } = await supabaseAdmin.from("subscriptions").insert(sInserts);
        if (e6) return NextResponse.json({ step: "subscriptions", error: e6.message }, { status: 500 });

        return NextResponse.json({
            ok: true,
            summary: {
                institutions: INSTITUTIONS.length,
                accounts: ACCOUNTS.length,
                holdings: HOLDINGS.length,
                funds: FUNDS.length,
                policies: POLICIES.length,
                subscriptions: SUBSCRIPTIONS.length,
            },
        });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
