// /api/setup — JSON 大法版,不需要 DDL
// GET                    → 回傳目前各 kind 的紀錄筆數
// POST { action:"seed" } → 用 jsonStore 把真實資產一次塞進 expenses 表
// POST { action:"reset" }→ 把 6 個 kind 的紀錄全部刪除

import { NextRequest, NextResponse } from "next/server";
import { HAS_SECRET } from "@/lib/supabaseAdmin";
import * as J from "@/lib/jsonStore";
import { INSTITUTIONS, ACCOUNTS, HOLDINGS, FUNDS, POLICIES, SUBSCRIPTIONS } from "@/lib/seedData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: J.Kind[] = ["institution", "account", "holding", "fund", "policy", "subscription"];

export async function GET() {
    if (!HAS_SECRET) {
        return NextResponse.json({ error: "SUPABASE_SECRET_KEY 未設定" }, { status: 503 });
    }
    const counts: Record<string, number> = {};
    for (const k of KINDS) {
        try {
            const list = await J.listAll(k);
            counts[k] = list.length;
        } catch (e: any) {
            counts[k] = -1;
        }
    }
    return NextResponse.json({
        counts,
        ready: true,
        message: "JSON 大法已啟用 — 不需要建表,所有資料偽裝成 expenses + project_label",
    });
}

export async function POST(req: NextRequest) {
    if (!HAS_SECRET) return NextResponse.json({ error: "SUPABASE_SECRET_KEY 未設定" }, { status: 503 });
    let body: any = {};
    try { body = await req.json(); } catch { }
    const action = body?.action;

    if (action === "reset") {
        const errs: string[] = [];
        for (const k of KINDS) {
            try { await J.deleteAllOfKind(k); }
            catch (e: any) { errs.push(`${k}: ${e.message}`); }
        }
        if (errs.length) return NextResponse.json({ ok: false, errors: errs }, { status: 500 });
        return NextResponse.json({ ok: true, message: "全部清空" });
    }

    if (action === "seed") {
        try {
            // 1) institutions(用 name 當 key,因為原本 ACCOUNTS/HOLDINGS 用 inst name 對應)
            const instMap = new Map<string, string>();
            for (let i = 0; i < INSTITUTIONS.length; i++) {
                const x = INSTITUTIONS[i];
                const r = await J.createOne("institution", { ...x, sort_order: i * 10 });
                instMap.set(x.name, r.id);
            }

            // 2) accounts
            for (let i = 0; i < ACCOUNTS.length; i++) {
                const a: any = ACCOUNTS[i];
                const id = instMap.get(a.inst);
                if (!id) throw new Error(`找不到 institution: ${a.inst}`);
                await J.createOne("account", { institution_id: id, name: a.name, account_type: a.account_type, currency: a.currency, balance: a.balance });
            }

            // 3) holdings
            for (let i = 0; i < HOLDINGS.length; i++) {
                const h: any = HOLDINGS[i];
                const id = instMap.get(h.inst);
                if (!id) throw new Error(`找不到 institution: ${h.inst}`);
                await J.createOne("holding", {
                    institution_id: id, symbol: h.symbol, name: h.name, market: h.market,
                    shares: h.shares, market_value: h.market_value, currency: h.currency,
                    classification: h.classification,
                });
            }

            // 4) funds
            for (let i = 0; i < FUNDS.length; i++) {
                const f: any = FUNDS[i];
                const id = instMap.get(f.inst);
                if (!id) throw new Error(`找不到 institution: ${f.inst}`);
                await J.createOne("fund", { institution_id: id, fund_code: f.fund_code, name: f.name, market_value: f.market_value, currency: f.currency });
            }

            // 5) policies
            for (let i = 0; i < POLICIES.length; i++) {
                const p: any = POLICIES[i];
                const id = instMap.get(p.inst);
                if (!id) throw new Error(`找不到 institution: ${p.inst}`);
                await J.createOne("policy", { institution_id: id, policy_name: p.policy_name, policy_type: p.policy_type, current_value: p.current_value, currency: p.currency });
            }

            // 6) subscriptions
            for (const s of SUBSCRIPTIONS as any[]) {
                await J.createOne("subscription", {
                    service_name: s.service_name, amount: s.amount, currency: s.currency, cycle: s.cycle,
                    payment_method: s.payment_method, category: s.category, planned_cancel: s.planned_cancel ?? false,
                });
            }

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
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
