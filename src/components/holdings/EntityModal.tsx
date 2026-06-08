"use client";

import { useEffect, useState } from "react";

export type EntityKind = "institution" | "account" | "holding" | "fund" | "policy" | "subscription";

const CURRENCIES = ["TWD", "USD", "CNY", "EUR", "JPY", "HKD"];

const FIELD_DEFS: Record<EntityKind, { key: string; label: string; type?: "text" | "number" | "select"; options?: string[]; required?: boolean }[]> = {
    institution: [
        { key: "name", label: "機構名稱", required: true },
        { key: "type", label: "類型", type: "select", options: ["bank", "broker", "insurance", "crypto", "other"], required: true },
        { key: "country", label: "國家", type: "select", options: ["TW", "CN", "US", "HK", "JP", "EU", "OTHER"] },
    ],
    account: [
        { key: "name", label: "帳戶名稱", required: true },
        { key: "account_type", label: "帳戶類型", type: "select", options: ["checking", "savings", "time_deposit", "foreign_currency", "brokerage", "crypto"], required: true },
        { key: "currency", label: "幣別", type: "select", options: CURRENCIES, required: true },
        { key: "balance", label: "餘額", type: "number", required: true },
        { key: "note", label: "備註" },
    ],
    holding: [
        { key: "symbol", label: "代號 (AAPL / 2330)", required: true },
        { key: "name", label: "名稱" },
        { key: "market", label: "市場", type: "select", options: ["US", "TW", "HK", "JP", "OTHER"], required: true },
        { key: "shares", label: "股數", type: "number", required: true },
        { key: "avg_cost", label: "平均成本(每股)", type: "number" },
        { key: "market_price", label: "市價(手動,可留空自動抓)", type: "number" },
        { key: "currency", label: "計價幣別", type: "select", options: CURRENCIES, required: true },
        { key: "classification", label: "投資分類", type: "select", options: ["core", "growth", "speculative", "other"] },
    ],
    fund: [
        { key: "fund_code", label: "基金代號" },
        { key: "name", label: "基金名稱", required: true },
        { key: "market_value", label: "現值", type: "number", required: true },
        { key: "currency", label: "幣別", type: "select", options: CURRENCIES, required: true },
        { key: "note", label: "備註" },
    ],
    policy: [
        { key: "policy_name", label: "保單名稱", required: true },
        { key: "policy_type", label: "保單類型 (例:利變美元壽險)" },
        { key: "current_value", label: "目前價值", type: "number", required: true },
        { key: "currency", label: "幣別", type: "select", options: CURRENCIES, required: true },
        { key: "note", label: "備註" },
    ],
    subscription: [
        { key: "service_name", label: "服務名稱", required: true },
        { key: "amount", label: "金額", type: "number", required: true },
        { key: "currency", label: "幣別", type: "select", options: CURRENCIES, required: true },
        { key: "cycle", label: "週期", type: "select", options: ["monthly", "quarterly", "yearly", "custom"], required: true },
        { key: "next_charge_at", label: "下次扣款日 (YYYY-MM-DD)" },
        { key: "payment_method", label: "扣款方式" },
        { key: "category", label: "類別" },
        { key: "note", label: "備註" },
    ],
};

const KIND_LABEL: Record<EntityKind, string> = {
    institution: "金融機構",
    account: "帳戶",
    holding: "持股",
    fund: "基金",
    policy: "保單",
    subscription: "訂閱",
};

type Props = {
    open: boolean;
    kind: EntityKind;
    initial?: Record<string, any>;
    extra?: Record<string, any>;  // 例如:institution_id 由外面傳入
    onClose: () => void;
    onSaved: () => void;
};

export default function EntityModal({ open, kind, initial, extra, onClose, onSaved }: Props) {
    const isEdit = Boolean(initial?.id);
    const [values, setValues] = useState<Record<string, any>>({});
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setValues({ ...(initial ?? {}) });
            setErr(null);
        }
    }, [open, initial]);

    if (!open) return null;

    const fields = FIELD_DEFS[kind];

    async function save() {
        setBusy(true); setErr(null);
        try {
            const payload = { ...extra, ...values };
            // 數字欄轉 Number
            for (const f of fields) {
                if (f.type === "number" && payload[f.key] !== undefined && payload[f.key] !== "") {
                    payload[f.key] = Number(payload[f.key]);
                }
            }
            const url = isEdit ? `/api/${pluralize(kind)}/${initial!.id}` : `/api/${pluralize(kind)}`;
            const method = isEdit ? "PATCH" : "POST";
            const r = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
            onSaved();
            onClose();
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="bg-[#0f172a] border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-white">
                    {isEdit ? "編輯" : "新增"} {KIND_LABEL[kind]}
                </h3>

                {err && <div className="bg-red-900/40 border border-red-700 rounded p-2 mb-3 text-sm text-red-200">{err}</div>}

                <div className="space-y-3">
                    {fields.map(f => (
                        <div key={f.key}>
                            <label className="block text-xs text-gray-400 mb-1">
                                {f.label} {f.required && <span className="text-red-400">*</span>}
                            </label>
                            {f.type === "select" ? (
                                <select
                                    value={values[f.key] ?? ""}
                                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value || null }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="">—</option>
                                    {f.options!.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={f.type === "number" ? "number" : "text"}
                                    step={f.type === "number" ? "any" : undefined}
                                    value={values[f.key] ?? ""}
                                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mt-5 justify-end">
                    <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm text-white">
                        取消
                    </button>
                    <button onClick={save} disabled={busy} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-sm text-white">
                        {busy ? "儲存中..." : "儲存"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function pluralize(k: EntityKind): string {
    return ({
        institution: "institutions",
        account: "accounts",
        holding: "holdings",
        fund: "funds",
        policy: "policies",
        subscription: "subscriptions",
    } as const)[k];
}
