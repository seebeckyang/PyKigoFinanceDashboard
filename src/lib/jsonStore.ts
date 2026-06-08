// JSON 大法:用既有的 expenses 表偽裝成 6 種資產類型
// 不需要任何 DDL,直接可用
//
// expenses schema:
//   date NOT NULL, store_name NOT NULL, amount NOT NULL, currency NOT NULL,
//   project_label NOT NULL, paid_by NOT NULL, paid_for NOT NULL,
//   is_reviewed BOOL NOT NULL, is_automated BOOL NOT NULL,
//   metadata JSONB
//
// 映射:
//   project_label = "asset:<kind>"  → kind ∈ institution|account|holding|fund|policy|subscription
//   store_name 用作 title
//   amount 用作 主要金額(機構=0, 帳戶=balance, 持股=market_value, ...)
//   currency 用作 幣別
//   metadata JSON 塞所有其他欄位
//
// 真實 expense 用 project_label = "expense" / "general" 區分

import { supabaseAdmin } from "./supabaseAdmin";

export type Kind = "institution" | "account" | "holding" | "fund" | "policy" | "subscription";

const NS = (k: Kind) => `asset:${k}`;

// 真實 expense 用的 project_label 集合(避開 asset: 開頭)
export function isAssetRow(project_label: string | null | undefined): boolean {
    return !!project_label && project_label.startsWith("asset:");
}

// ─── 從 expense 列 → 應用層物件 ───
export function fromRow(row: any, kind: Kind): any {
    const meta = row.metadata || {};
    const base = {
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ...meta,
    };
    switch (kind) {
        case "institution":
            return { ...base, name: row.store_name, type: meta.type, country: meta.country, sort_order: meta.sort_order };
        case "account":
            return {
                ...base,
                name: row.store_name,
                balance: Number(row.amount) || 0,
                currency: row.currency,
                institution_id: meta.institution_id,
                account_type: meta.account_type,
            };
        case "holding":
            return {
                ...base,
                symbol: meta.symbol || row.store_name,
                name: meta.name || row.store_name,
                shares: Number(meta.shares) || 0,
                market_value: Number(row.amount) || 0,
                market_price: meta.market_price,
                currency: row.currency,
                institution_id: meta.institution_id,
                market: meta.market,
                classification: meta.classification,
            };
        case "fund":
            return {
                ...base,
                name: row.store_name,
                fund_code: meta.fund_code,
                market_value: Number(row.amount) || 0,
                currency: row.currency,
                institution_id: meta.institution_id,
            };
        case "policy":
            return {
                ...base,
                policy_name: row.store_name,
                policy_type: meta.policy_type,
                current_value: Number(row.amount) || 0,
                currency: row.currency,
                institution_id: meta.institution_id,
            };
        case "subscription":
            return {
                ...base,
                service_name: row.store_name,
                amount: Number(row.amount) || 0,
                currency: row.currency,
                cycle: meta.cycle || "monthly",
                next_charge_at: meta.next_charge_at,
                category: meta.category,
                planned_cancel: !!meta.planned_cancel,
                payment_method: meta.payment_method,
            };
    }
}

// ─── 從應用層物件 → expense row payload ───
export function toRow(kind: Kind, obj: any): any {
    const today = new Date().toISOString().slice(0, 10);
    const baseDate = obj.date || today;

    switch (kind) {
        case "institution":
            return {
                date: baseDate,
                store_name: obj.name || "(未命名)",
                amount: 0,
                currency: "TWD",
                project_label: NS("institution"),
                paid_by: "CY", paid_for: "CY",
                is_reviewed: true, is_automated: false,
                metadata: { type: obj.type, country: obj.country, sort_order: obj.sort_order },
            };
        case "account":
            return {
                date: baseDate,
                store_name: obj.name || "(未命名)",
                amount: Number(obj.balance) || 0,
                currency: obj.currency || "TWD",
                project_label: NS("account"),
                paid_by: "CY", paid_for: "CY",
                is_reviewed: true, is_automated: false,
                metadata: { institution_id: obj.institution_id, account_type: obj.account_type },
            };
        case "holding":
            return {
                date: baseDate,
                store_name: obj.symbol || obj.name || "(未命名)",
                amount: Number(obj.market_value) || 0,
                currency: obj.currency || "USD",
                project_label: NS("holding"),
                paid_by: "CY", paid_for: "CY",
                is_reviewed: true, is_automated: false,
                metadata: {
                    institution_id: obj.institution_id,
                    symbol: obj.symbol, name: obj.name,
                    shares: Number(obj.shares) || 0,
                    market_price: obj.market_price,
                    market: obj.market,
                    classification: obj.classification,
                },
            };
        case "fund":
            return {
                date: baseDate,
                store_name: obj.name || "(未命名基金)",
                amount: Number(obj.market_value) || 0,
                currency: obj.currency || "TWD",
                project_label: NS("fund"),
                paid_by: "CY", paid_for: "CY",
                is_reviewed: true, is_automated: false,
                metadata: { institution_id: obj.institution_id, fund_code: obj.fund_code },
            };
        case "policy":
            return {
                date: baseDate,
                store_name: obj.policy_name || "(未命名保單)",
                amount: Number(obj.current_value) || 0,
                currency: obj.currency || "TWD",
                project_label: NS("policy"),
                paid_by: "CY", paid_for: "CY",
                is_reviewed: true, is_automated: false,
                metadata: { institution_id: obj.institution_id, policy_type: obj.policy_type },
            };
        case "subscription":
            return {
                date: baseDate,
                store_name: obj.service_name || "(未命名訂閱)",
                amount: Number(obj.amount) || 0,
                currency: obj.currency || "TWD",
                project_label: NS("subscription"),
                paid_by: "CY", paid_for: "CY",
                is_reviewed: true, is_automated: false,
                metadata: {
                    cycle: obj.cycle || "monthly",
                    next_charge_at: obj.next_charge_at,
                    category: obj.category,
                    planned_cancel: !!obj.planned_cancel,
                    payment_method: obj.payment_method,
                },
            };
    }
}

// ─── CRUD helpers ───
export async function listAll(kind: Kind): Promise<any[]> {
    const r = await supabaseAdmin.from("expenses").select("*")
        .eq("project_label", NS(kind))
        .order("created_at", { ascending: true });
    if (r.error) throw new Error(r.error.message);
    return (r.data ?? []).map(row => fromRow(row, kind));
}

export async function createOne(kind: Kind, obj: any): Promise<any> {
    const payload = toRow(kind, obj);
    const r = await supabaseAdmin.from("expenses").insert(payload).select().single();
    if (r.error) throw new Error(r.error.message);
    return fromRow(r.data, kind);
}

export async function updateOne(kind: Kind, id: string, patch: any): Promise<any> {
    // 讀回原 row → merge metadata → 寫回
    const cur = await supabaseAdmin.from("expenses").select("*").eq("id", id).single();
    if (cur.error) throw new Error(cur.error.message);
    const merged = { ...fromRow(cur.data, kind), ...patch };
    const payload = toRow(kind, merged);
    const r = await supabaseAdmin.from("expenses").update(payload).eq("id", id).select().single();
    if (r.error) throw new Error(r.error.message);
    return fromRow(r.data, kind);
}

export async function deleteOne(_kind: Kind, id: string): Promise<void> {
    const r = await supabaseAdmin.from("expenses").delete().eq("id", id);
    if (r.error) throw new Error(r.error.message);
}

export async function deleteAllOfKind(kind: Kind): Promise<void> {
    const r = await supabaseAdmin.from("expenses").delete().eq("project_label", NS(kind));
    if (r.error) throw new Error(r.error.message);
}
