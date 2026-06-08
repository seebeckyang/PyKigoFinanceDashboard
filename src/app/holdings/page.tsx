"use client";

// ─── /holdings:家庭資產總覽,全 CRUD ───────────────────────────────────────
//
// 結構:
//   每張卡 = 一家金融機構(institutions)
//   卡內依 type 顯示子項目:accounts / holdings / funds / policies
//   訂閱(subscriptions)獨立一張卡放最下面
//   每個項目都可以 ＋✏️🗑️
//
// 金額顯示:
//   每個子項目顯示「原幣別」+「≈ TWD 折算」(用 useFxRates)
//   機構卡標題顯示「機構小計 TWD」
//   頁面頂端顯示「家庭總資產 TWD」+ 配置餅圖

import { useEffect, useMemo, useState } from "react";
import { useFxRates, formatMoneyWithTWD, formatMoney } from "@/lib/fx";
import EntityModal, { EntityKind } from "@/components/holdings/EntityModal";
import { Pencil, Trash2, Plus, RefreshCw, AlertTriangle } from "lucide-react";

type Institution = { id: string; name: string; type: string; country?: string; sort_order?: number };
type Account = { id: string; institution_id: string; name: string; account_type: string; currency: string; balance: number };
type Holding = { id: string; institution_id: string; symbol: string; name?: string; market?: string; shares: number; market_value?: number; market_price?: number; currency: string; classification?: string };
type Fund = { id: string; institution_id: string; fund_code?: string; name: string; market_value: number; currency: string };
type Policy = { id: string; institution_id: string; policy_name: string; policy_type?: string; current_value: number; currency: string };
type Subscription = { id: string; service_name: string; amount: number; currency: string; cycle: string; next_charge_at?: string; category?: string; planned_cancel?: boolean };

export default function HoldingsPage() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [funds, setFunds] = useState<Fund[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [modal, setModal] = useState<{ open: boolean; kind: EntityKind; initial?: any; extra?: any }>({ open: false, kind: "institution" });

    const { convertToTWD } = useFxRates();

    async function loadAll() {
        setErr(null);
        try {
            const [r1, r2, r3, r4, r5, r6] = await Promise.all([
                fetch("/api/institutions", { cache: "no-store" }),
                fetch("/api/accounts", { cache: "no-store" }),
                fetch("/api/holdings", { cache: "no-store" }),
                fetch("/api/funds", { cache: "no-store" }),
                fetch("/api/policies", { cache: "no-store" }),
                fetch("/api/subscriptions", { cache: "no-store" }),
            ]);
            const checks = [r1, r2, r3, r4, r5, r6];
            for (const r of checks) {
                if (!r.ok) {
                    const t = await r.text();
                    throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
                }
            }
            const [j1, j2, j3, j4, j5, j6] = await Promise.all(checks.map(r => r.json()));
            setInstitutions(j1.data ?? []);
            setAccounts(j2.data ?? []);
            setHoldings(j3.data ?? []);
            setFunds(j4.data ?? []);
            setPolicies(j5.data ?? []);
            setSubscriptions(j6.data ?? []);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadAll(); }, []);

    // ─── 計算家庭總資產 ───
    const totalTwd = useMemo(() => {
        let t = 0;
        for (const a of accounts) t += convertToTWD(Number(a.balance) || 0, a.currency);
        for (const h of holdings) t += convertToTWD(Number(h.market_value) || 0, h.currency);
        for (const f of funds) t += convertToTWD(Number(f.market_value) || 0, f.currency);
        for (const p of policies) t += convertToTWD(Number(p.current_value) || 0, p.currency);
        return t;
    }, [accounts, holdings, funds, policies, convertToTWD]);

    // ─── 每家機構小計 ───
    function instTotal(instId: string): number {
        let t = 0;
        for (const a of accounts.filter(x => x.institution_id === instId)) t += convertToTWD(Number(a.balance) || 0, a.currency);
        for (const h of holdings.filter(x => x.institution_id === instId)) t += convertToTWD(Number(h.market_value) || 0, h.currency);
        for (const f of funds.filter(x => x.institution_id === instId)) t += convertToTWD(Number(f.market_value) || 0, f.currency);
        for (const p of policies.filter(x => x.institution_id === instId)) t += convertToTWD(Number(p.current_value) || 0, p.currency);
        return t;
    }

    // ─── 集中度示警(以單一持股市值佔總資產 % 計算)───
    const concentrationAlerts = useMemo(() => {
        if (!totalTwd) return [];
        const alerts: { symbol: string; pct: number; level: "warning" | "danger" }[] = [];
        const bySymbol = new Map<string, number>();
        for (const h of holdings) {
            const twd = convertToTWD(Number(h.market_value) || 0, h.currency);
            bySymbol.set(h.symbol, (bySymbol.get(h.symbol) ?? 0) + twd);
        }
        for (const [sym, twd] of bySymbol.entries()) {
            const pct = (twd / totalTwd) * 100;
            if (pct >= 20) alerts.push({ symbol: sym, pct, level: "danger" });
            else if (pct >= 10) alerts.push({ symbol: sym, pct, level: "warning" });
        }
        return alerts.sort((a, b) => b.pct - a.pct);
    }, [holdings, totalTwd, convertToTWD]);

    async function handleDelete(kind: EntityKind, id: string) {
        if (!confirm("確定刪除?")) return;
        const url = `/api/${pluralize(kind)}/${id}`;
        const r = await fetch(url, { method: "DELETE" });
        if (!r.ok) { alert(`刪除失敗: ${await r.text()}`); return; }
        await loadAll();
    }

    if (loading) return <div className="p-8 text-white">載入中...</div>;

    if (err) return (
        <div className="p-8 max-w-3xl mx-auto text-white">
            <div className="bg-red-900/40 border border-red-700 rounded p-4 mb-4">
                <div className="font-semibold mb-2">⚠️ 載入失敗</div>
                <div className="text-sm font-mono">{err}</div>
            </div>
            <p className="text-sm text-gray-400 mb-3">
                可能原因:資料表還沒建。前往 <a href="/setup" className="text-blue-400 underline">/setup</a> 完成初始設定。
            </p>
            <a href="/setup" className="inline-block bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm">前往初始設定</a>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">家庭資產總覽</h1>
                    <p className="text-sm text-gray-400">{institutions.length} 家機構 · {accounts.length + holdings.length + funds.length + policies.length} 個項目</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadAll} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm flex items-center gap-1">
                        <RefreshCw size={14} /> 重新整理
                    </button>
                    <button onClick={() => setModal({ open: true, kind: "institution" })}
                        className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm flex items-center gap-1">
                        <Plus size={14} /> 新增機構
                    </button>
                </div>
            </div>

            {/* 總資產卡 */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700/40 rounded-lg p-5 mb-5">
                <div className="text-xs text-gray-300 mb-1">家庭總資產(TWD 折算)</div>
                <div className="text-3xl font-bold tabular-nums">NT$ {Math.round(totalTwd).toLocaleString()}</div>
            </div>

            {/* 集中度示警 */}
            {concentrationAlerts.length > 0 && (
                <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2 text-yellow-300 font-semibold">
                        <AlertTriangle size={16} /> 集中度示警
                    </div>
                    <div className="space-y-1 text-sm">
                        {concentrationAlerts.map(a => (
                            <div key={a.symbol}>
                                <span className={a.level === "danger" ? "text-red-300" : "text-yellow-300"}>
                                    {a.symbol}
                                </span>
                                <span className="text-gray-400"> 佔 </span>
                                <span className="font-semibold">{a.pct.toFixed(1)}%</span>
                                <span className="text-gray-500 ml-2">{a.level === "danger" ? "(>20% 紅燈)" : "(>10% 黃燈)"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 機構卡列表 */}
            {institutions.length === 0 ? (
                <div className="bg-[#111827] border border-gray-800 rounded-lg p-8 text-center">
                    <div className="text-gray-400 mb-3">還沒有任何金融機構</div>
                    <div className="flex justify-center gap-2">
                        <a href="/setup" className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm">🚀 從 /setup 一鍵匯入真實資產</a>
                        <button onClick={() => setModal({ open: true, kind: "institution" })}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm">
                            ＋ 自己新增第一家
                        </button>
                    </div>
                </div>
            ) : institutions.map(inst => (
                <InstitutionCard
                    key={inst.id}
                    inst={inst}
                    totalTwd={instTotal(inst.id)}
                    accounts={accounts.filter(a => a.institution_id === inst.id)}
                    holdings={holdings.filter(h => h.institution_id === inst.id)}
                    funds={funds.filter(f => f.institution_id === inst.id)}
                    policies={policies.filter(p => p.institution_id === inst.id)}
                    convertToTWD={convertToTWD}
                    onAddChild={(kind) => setModal({ open: true, kind, extra: { institution_id: inst.id } })}
                    onEdit={(kind, item) => setModal({ open: true, kind, initial: item, extra: { institution_id: inst.id } })}
                    onEditInst={() => setModal({ open: true, kind: "institution", initial: inst })}
                    onDeleteInst={() => handleDelete("institution", inst.id)}
                    onDelete={(kind, id) => handleDelete(kind, id)}
                />
            ))}

            {/* 訂閱卡 */}
            <SubscriptionsCard
                subscriptions={subscriptions}
                convertToTWD={convertToTWD}
                onAdd={() => setModal({ open: true, kind: "subscription" })}
                onEdit={(s) => setModal({ open: true, kind: "subscription", initial: s })}
                onDelete={(id) => handleDelete("subscription", id)}
            />

            {/* Modal */}
            <EntityModal
                open={modal.open}
                kind={modal.kind}
                initial={modal.initial}
                extra={modal.extra}
                onClose={() => setModal(m => ({ ...m, open: false }))}
                onSaved={loadAll}
            />
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────

function InstitutionCard(props: {
    inst: Institution;
    totalTwd: number;
    accounts: Account[];
    holdings: Holding[];
    funds: Fund[];
    policies: Policy[];
    convertToTWD: (n: number, c: string) => number;
    onAddChild: (kind: EntityKind) => void;
    onEdit: (kind: EntityKind, item: any) => void;
    onEditInst: () => void;
    onDeleteInst: () => void;
    onDelete: (kind: EntityKind, id: string) => void;
}) {
    const { inst, totalTwd, accounts, holdings, funds, policies, convertToTWD } = props;
    const typeLabel: Record<string, string> = { bank: "銀行", broker: "券商", insurance: "保險", crypto: "加密", other: "其他" };

    return (
        <div className="bg-[#111827] border border-gray-800 rounded-lg p-4 mb-3">
            {/* 機構標題 */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
                <div>
                    <div className="font-semibold text-base">{inst.name}</div>
                    <div className="text-xs text-gray-500">{typeLabel[inst.type] || inst.type} · {inst.country}</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-lg font-bold tabular-nums">NT$ {Math.round(totalTwd).toLocaleString()}</div>
                    </div>
                    <button onClick={props.onEditInst} className="text-gray-400 hover:text-white p-1"><Pencil size={14} /></button>
                    <button onClick={props.onDeleteInst} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
            </div>

            {/* 子項目分組 */}
            <SubSection title="活期 / 定存" items={accounts}
                onAdd={() => props.onAddChild("account")}
                renderItem={(a) => {
                    const m = formatMoneyWithTWD(Number(a.balance) || 0, a.currency, convertToTWD);
                    return (
                        <ItemRow
                            key={a.id}
                            left={<div>
                                <div className="text-sm">{a.name}</div>
                                <div className="text-[10px] text-gray-500">{a.account_type}</div>
                            </div>}
                            right={<div className="text-right">
                                <div className="text-sm tabular-nums">{m.primary}</div>
                                {m.secondary && <div className="text-[10px] text-gray-500">{m.secondary}</div>}
                            </div>}
                            onEdit={() => props.onEdit("account", a)}
                            onDelete={() => props.onDelete("account", a.id)}
                        />
                    );
                }} />

            <SubSection title="持股 / ETF" items={holdings}
                onAdd={() => props.onAddChild("holding")}
                renderItem={(h) => {
                    const mv = Number(h.market_value) || 0;
                    const m = formatMoneyWithTWD(mv, h.currency, convertToTWD);
                    return (
                        <ItemRow key={h.id}
                            left={<div>
                                <div className="text-sm font-medium">{h.symbol} <span className="text-gray-500 font-normal">· {h.name}</span></div>
                                <div className="text-[10px] text-gray-500">{h.shares} 股 · {h.market} {h.classification && <span className="ml-1 text-blue-400">[{h.classification}]</span>}</div>
                            </div>}
                            right={<div className="text-right">
                                <div className="text-sm tabular-nums">{m.primary}</div>
                                {m.secondary && <div className="text-[10px] text-gray-500">{m.secondary}</div>}
                            </div>}
                            onEdit={() => props.onEdit("holding", h)}
                            onDelete={() => props.onDelete("holding", h.id)}
                        />
                    );
                }} />

            <SubSection title="基金" items={funds}
                onAdd={() => props.onAddChild("fund")}
                renderItem={(f) => {
                    const m = formatMoneyWithTWD(Number(f.market_value) || 0, f.currency, convertToTWD);
                    return (
                        <ItemRow key={f.id}
                            left={<div>
                                <div className="text-sm">{f.fund_code} <span className="text-gray-500">{f.name}</span></div>
                            </div>}
                            right={<div className="text-right">
                                <div className="text-sm tabular-nums">{m.primary}</div>
                                {m.secondary && <div className="text-[10px] text-gray-500">{m.secondary}</div>}
                            </div>}
                            onEdit={() => props.onEdit("fund", f)}
                            onDelete={() => props.onDelete("fund", f.id)}
                        />
                    );
                }} />

            <SubSection title="保單" items={policies}
                onAdd={() => props.onAddChild("policy")}
                renderItem={(p) => {
                    const m = formatMoneyWithTWD(Number(p.current_value) || 0, p.currency, convertToTWD);
                    return (
                        <ItemRow key={p.id}
                            left={<div>
                                <div className="text-sm">{p.policy_name}</div>
                                <div className="text-[10px] text-gray-500">{p.policy_type}</div>
                            </div>}
                            right={<div className="text-right">
                                <div className="text-sm tabular-nums">{m.primary}</div>
                                {m.secondary && <div className="text-[10px] text-gray-500">{m.secondary}</div>}
                            </div>}
                            onEdit={() => props.onEdit("policy", p)}
                            onDelete={() => props.onDelete("policy", p.id)}
                        />
                    );
                }} />
        </div>
    );
}

function SubSection<T>(props: { title: string; items: T[]; onAdd: () => void; renderItem: (i: T) => React.ReactNode }) {
    if (props.items.length === 0) return (
        <div className="mb-1 text-right">
            <button onClick={props.onAdd} className="text-xs text-blue-400 hover:text-blue-300">＋ 新增{props.title}</button>
        </div>
    );
    return (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-500">{props.title}</div>
                <button onClick={props.onAdd} className="text-xs text-blue-400 hover:text-blue-300">＋ 新增</button>
            </div>
            <div className="space-y-1">{props.items.map(props.renderItem)}</div>
        </div>
    );
}

function ItemRow(props: { left: React.ReactNode; right: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
    return (
        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-800/50 group">
            <div className="flex-1">{props.left}</div>
            <div className="flex items-center gap-2">
                {props.right}
                <button onClick={props.onEdit} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition"><Pencil size={12} /></button>
                <button onClick={props.onDelete} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
            </div>
        </div>
    );
}

function SubscriptionsCard(props: {
    subscriptions: Subscription[];
    convertToTWD: (n: number, c: string) => number;
    onAdd: () => void;
    onEdit: (s: Subscription) => void;
    onDelete: (id: string) => void;
}) {
    const monthlyTwd = useMemo(() => {
        let t = 0;
        for (const s of props.subscriptions) {
            const m = Number(s.amount) || 0;
            const cycleMul = s.cycle === "yearly" ? 1 / 12 : s.cycle === "quarterly" ? 1 / 3 : 1;
            t += props.convertToTWD(m * cycleMul, s.currency);
        }
        return t;
    }, [props.subscriptions, props.convertToTWD]);

    return (
        <div className="bg-[#111827] border border-gray-800 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
                <div>
                    <div className="font-semibold">訂閱服務</div>
                    <div className="text-xs text-gray-500">{props.subscriptions.length} 個訂閱 · 月攤提 NT$ {Math.round(monthlyTwd).toLocaleString()}</div>
                </div>
                <button onClick={props.onAdd} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs flex items-center gap-1">
                    <Plus size={12} /> 新增訂閱
                </button>
            </div>
            <div className="space-y-1">
                {props.subscriptions.map(s => {
                    const m = formatMoney(Number(s.amount) || 0, s.currency);
                    return (
                        <ItemRow key={s.id}
                            left={<div>
                                <div className="text-sm">{s.service_name} {s.planned_cancel && <span className="text-xs text-red-400 ml-1">[計畫取消]</span>}</div>
                                <div className="text-[10px] text-gray-500">{s.cycle} · {s.category} {s.next_charge_at && `· 下次 ${s.next_charge_at}`}</div>
                            </div>}
                            right={<div className="text-sm tabular-nums">{m}</div>}
                            onEdit={() => props.onEdit(s)}
                            onDelete={() => props.onDelete(s.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function pluralize(k: EntityKind): string {
    return ({
        institution: "institutions", account: "accounts", holding: "holdings",
        fund: "funds", policy: "policies", subscription: "subscriptions",
    } as const)[k];
}
