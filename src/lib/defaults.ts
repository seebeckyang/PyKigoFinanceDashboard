// ───────────────────────────────────────────────────────────
// 集中管理的預設值清單（供 wizard / settings / import 等共用）
// ───────────────────────────────────────────────────────────

/** 預設幣別清單（依使用頻率排序） */
export const DEFAULT_CURRENCIES = [
    { code: "TWD", label: "TWD 台幣" },
    { code: "USD", label: "USD 美金" },
    { code: "CNY", label: "CNY 人民幣" },
    { code: "EUR", label: "EUR 歐元" },
    { code: "JPY", label: "JPY 日幣" },
    { code: "HKD", label: "HKD 港幣" },
] as const;

export const DEFAULT_CURRENCY_CODES = DEFAULT_CURRENCIES.map((c) => c.code);

/** 預設資產類型（基本帳務分類） */
export const DEFAULT_ASSET_TYPES = [
    { code: "cash", label: "現金活存" },
    { code: "fixed_deposit", label: "定存" },
    { code: "stock", label: "股票 / ETF" },
    { code: "rsu", label: "RSU" },
] as const;

/** 預設投資策略分類（核心 / 成長 / 定存 / 投機，沿用現有策略頁設定） */
export const DEFAULT_STRATEGY_CATEGORIES = [
    "核心持股 (大型股)",
    "成長動能 (科技股)",
    "定存股 (領息資產)",
    "投機/現金資產",
] as const;

/** 預設機構類型 */
export const DEFAULT_INSTITUTION_TYPES = [
    { code: "broker", label: "券商" },
    { code: "bank", label: "銀行" },
    { code: "insurance", label: "保險" },
    { code: "fund_platform", label: "基金平台" },
] as const;
