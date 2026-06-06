// 靜態 Demo Mode 版本 — 由使用者真實資產資料（user_real_data.json）產生
// 原本連線 Supabase 的 server action 已改為純前端函式，可直接靜態輸出。

import { REAL_DATA } from "@/lib/realData";

const SNAP_ID = "real-2026-02";

// 將真實資產拆成 rawRecords（供首頁互動篩選使用）
function buildRawRecords() {
    const records: any[] = [];
    let i = 0;
    // 股票
    REAL_DATA.holdings.forEach((h) => {
        records.push({
            id: `stk-${i++}`,
            total_twd_value: h.valueTwd,
            assets: {
                currency: h.currency,
                asset_type: h.category === "成長" ? "stock" : h.category === "投機" ? "stock" : "stock",
                owner: "Both",
                title: h.name,
                ticker_symbol: h.symbol,
                strategy_category: h.category,
            },
        });
    });
    // 帳戶（現金 / 定存）
    REAL_DATA.accounts.forEach((a) => {
        records.push({
            id: `acc-${i++}`,
            total_twd_value: a.valueTwd,
            assets: {
                currency: a.currency,
                asset_type: a.subtype === "定存" ? "fixed_deposit" : "cash",
                owner: "Both",
                title: a.name,
                strategy_category: "定存/現金",
            },
        });
    });
    // 基金
    REAL_DATA.funds.forEach((f: any) => {
        records.push({
            id: `fund-${i++}`,
            total_twd_value: Math.round(f.current_value * REAL_DATA.fx),
            assets: { currency: f.currency, asset_type: "fund", owner: "Both", title: f.name, strategy_category: "定存/現金" },
        });
    });
    // 保單
    REAL_DATA.policies.forEach((p: any) => {
        records.push({
            id: `pol-${i++}`,
            total_twd_value: Math.round(p.current_value * REAL_DATA.fx),
            assets: { currency: p.currency, asset_type: "insurance", owner: "Both", title: p.name, strategy_category: "定存/現金" },
        });
    });
    return records;
}

const RAW_RECORDS = buildRawRecords();

const DASHBOARD_DATA = {
    totalNetWorth: REAL_DATA.grandTotal,
    grandTotal: REAL_DATA.grandTotal,
    stockTotal: REAL_DATA.stockTotal,
    currencyData: REAL_DATA.currencyAllocation,
    allocationData: REAL_DATA.assetTypeAllocation,
    strategyAllocationData: REAL_DATA.strategyAllocation,
    ownershipData: [
        { name: "家庭共同", value: 100, raw_value: REAL_DATA.grandTotal, color: "#2E7CF6", originalKey: "Both" },
    ],
    concentrationAlerts: REAL_DATA.concentrationAlerts,
    topHoldingsPie: REAL_DATA.topHoldingsPie,
    trendData: [
        { id: "s1", name: "2024/12", assets: 720, fullAssets: 720, filteredAssets: 720, color: "#5A6B89" },
        { id: "s2", name: "2025/06", assets: 815, fullAssets: 815, filteredAssets: 815, color: "#5A6B89" },
        { id: "s3", name: "2025/12", assets: 882, fullAssets: 882, filteredAssets: 882, color: "#5A6B89" },
        { id: SNAP_ID, name: "2026/02", assets: Math.round(REAL_DATA.grandTotal / 10000), fullAssets: Math.round(REAL_DATA.grandTotal / 10000), filteredAssets: Math.round(REAL_DATA.grandTotal / 10000), color: "#22D3EE" },
    ],
    latestSnapshot: { id: SNAP_ID, period_name: "2026/02", created_at: new Date().toISOString() },
    snapshotDetails: {
        [SNAP_ID]: {
            period_name: "2026/02",
            totalNetWorth: REAL_DATA.grandTotal,
            rawRecords: RAW_RECORDS,
            currencyData: REAL_DATA.currencyAllocation,
            allocationData: REAL_DATA.assetTypeAllocation,
            ownershipData: [
                { name: "家庭共同", value: 100, raw_value: REAL_DATA.grandTotal, color: "#2E7CF6", originalKey: "Both" },
            ],
            strategyAllocationData: REAL_DATA.strategyAllocation,
        },
    },
    rawRecords: RAW_RECORDS,
};

export async function getLatestDashboardData(): Promise<any> {
    return DASHBOARD_DATA;
}

export async function getReportData(_snapshotId?: string) {
    const fmt = (v: number) => v;
    const assetItems = [
        ...REAL_DATA.holdings.map((h, i) => ({
            id: i + 1,
            owner: "Both",
            ownerColor: "bg-indigo-100 text-indigo-700",
            type: "股票",
            name: `${h.name} (${h.symbol})`,
            originalAmount: `${h.shares.toLocaleString()} 股`,
            ntdAmount: h.valueTwd,
            category: "Stocks",
        })),
        ...REAL_DATA.accounts.map((a, i) => ({
            id: 1000 + i,
            owner: "Both",
            ownerColor: "bg-emerald-100 text-emerald-700",
            type: a.subtype === "定存" ? "定存" : "活存",
            name: `${a.institution} ${a.name}`,
            originalAmount: `$ ${a.balance.toLocaleString()} (${a.currency})`,
            ntdAmount: a.valueTwd,
            category: "Cash",
        })),
    ];
    return {
        summaryCards: [
            { title: "家庭總資產淨值", amount: REAL_DATA.grandTotal, subtitle: "資料期數：2026/02", borderColor: "border-blue-500" },
            { title: "股票部位", amount: REAL_DATA.stockTotal, subtitle: `${REAL_DATA.holdings.length} 檔個股 / ETF`, borderColor: "border-cyan-500" },
            { title: "現金 + 定存", amount: REAL_DATA.accounts.reduce((s, a) => s + a.valueTwd, 0), subtitle: `${REAL_DATA.accounts.length} 個帳戶`, borderColor: "border-amber-400" },
            { title: "基金 + 保單", amount: REAL_DATA.fundsTotal + REAL_DATA.policiesTotal, subtitle: "美元計價資產", borderColor: "border-purple-500" },
        ],
        assetItems,
        liveMarketData: [],
        periodName: "2026/02",
        createdAt: new Date().toISOString(),
        availableSnapshots: [{ id: SNAP_ID, period_name: "2026/02", created_at: new Date().toISOString() }],
    };
}
