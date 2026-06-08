// ───────────────────────────────────────────────────────────────────────────
//  Seed Data:你的真實 15 機構 / 帳戶 / 持股 / 基金 / 保單 / 訂閱
//  (從截圖整理出來)
// ───────────────────────────────────────────────────────────────────────────

export type Institution = {
    name: string; type: "bank" | "broker" | "insurance"; country: string;
};

export type Account = {
    inst: string; name: string;
    account_type: "checking" | "savings" | "time_deposit" | "foreign_currency" | "brokerage";
    currency: string; balance: number;
};

export type Holding = {
    inst: string; symbol: string; name: string; market: "US" | "TW" | "HK" | "JP";
    shares: number; market_value: number; currency: string;
    classification?: "core" | "growth" | "speculative";
    price_locked?: boolean;
};

export type Fund = {
    inst: string; fund_code: string; name: string; market_value: number; currency: string;
};

export type Policy = {
    inst: string; policy_name: string; policy_type: string; current_value: number; currency: string;
};

export type Subscription = {
    service_name: string; amount: number; currency: string;
    cycle: "monthly" | "quarterly" | "yearly"; payment_method?: string; category?: string;
    planned_cancel?: boolean; note?: string;
};

export const INSTITUTIONS: Institution[] = [
    { name: "永豐金控", type: "broker", country: "TW" },
    { name: "富邦金控(台灣)", type: "broker", country: "TW" },
    { name: "富邦華一銀行(中國)", type: "bank", country: "CN" },
    { name: "中國銀行(中國)", type: "bank", country: "CN" },
    { name: "Firstrade", type: "broker", country: "US" },
    { name: "玉山金控", type: "bank", country: "TW" },
    { name: "國泰人壽", type: "insurance", country: "TW" },
    { name: "Line Bank", type: "bank", country: "TW" },
    { name: "聯邦銀行", type: "bank", country: "TW" },
    { name: "平安銀行(中國)", type: "bank", country: "CN" },
    { name: "台新金控", type: "bank", country: "TW" },
];

export const ACCOUNTS: Account[] = [
    // 永豐金控
    { inst: "永豐金控", name: "永豐銀行-大戶", account_type: "checking", currency: "TWD", balance: 191891 },
    { inst: "永豐金控", name: "永豐銀行-台中", account_type: "checking", currency: "TWD", balance: 6732 },
    { inst: "永豐金控", name: "永豐銀行-中興分行", account_type: "checking", currency: "TWD", balance: 0 },
    { inst: "永豐金控", name: "永豐銀行-大戶外幣", account_type: "time_deposit", currency: "USD", balance: 4529.40 },
    // 富邦金控(台灣)
    { inst: "富邦金控(台灣)", name: "富邦銀行", account_type: "checking", currency: "TWD", balance: 298069 },
    // 富邦華一(中國)
    { inst: "富邦華一銀行(中國)", name: "富邦華一-活期", account_type: "checking", currency: "CNY", balance: 18328.31 },
    { inst: "富邦華一銀行(中國)", name: "富邦華一-定存", account_type: "time_deposit", currency: "CNY", balance: 60600 },
    // 中國銀行
    { inst: "中國銀行(中國)", name: "中國銀行", account_type: "checking", currency: "CNY", balance: 8423.92 },
    // Firstrade
    { inst: "Firstrade", name: "Firstrade 活期", account_type: "brokerage", currency: "USD", balance: 7708.96 },
    // 玉山
    { inst: "玉山金控", name: "玉山銀行", account_type: "checking", currency: "TWD", balance: 58131 },
    { inst: "玉山金控", name: "玉山外幣", account_type: "foreign_currency", currency: "TWD", balance: 99 },
    // Line Bank
    { inst: "Line Bank", name: "line 活存", account_type: "checking", currency: "TWD", balance: 242 },
    // 聯邦銀行
    { inst: "聯邦銀行", name: "聯邦銀行", account_type: "checking", currency: "TWD", balance: 62000 },
    // 平安銀行(中國)
    { inst: "平安銀行(中國)", name: "平安銀行-車貸帳戶", account_type: "checking", currency: "CNY", balance: 3475.01 },
    // 台新金控
    { inst: "台新金控", name: "台新", account_type: "checking", currency: "TWD", balance: 328 },
];

export const HOLDINGS: Holding[] = [
    // 永豐金控 — 股票
    { inst: "永豐金控", symbol: "AAPL", name: "Apple Inc.", market: "US", shares: 16, market_value: 4900.96, currency: "USD", classification: "core" },
    { inst: "永豐金控", symbol: "2330", name: "TAIWAN SEMICONDUCTOR", market: "TW", shares: 200, market_value: 476000, currency: "TWD", classification: "core" },
    { inst: "永豐金控", symbol: "2812", name: "TAICHUNG COMMERCIAL BANK", market: "TW", shares: 14000, market_value: 261800, currency: "TWD", classification: "core" },
    { inst: "永豐金控", symbol: "2884", name: "E SUN FINANCIAL HOLDINGS", market: "TW", shares: 13000, market_value: 418600, currency: "TWD", classification: "core" },
    { inst: "永豐金控", symbol: "2890", name: "SINOPAC FINANCIAL HLDGS", market: "TW", shares: 20000, market_value: 620000, currency: "TWD", classification: "core" },
    { inst: "永豐金控", symbol: "2887g", name: "TS FINANCIAL HOLDING", market: "TW", shares: 23, market_value: 981, currency: "TWD", classification: "core" },
    { inst: "永豐金控", symbol: "2891c", name: "CTBC FINANCIAL HOLDINGS", market: "TW", shares: 6, market_value: 376, currency: "TWD", classification: "core" },
    // 富邦金控(台灣) — 股票
    { inst: "富邦金控(台灣)", symbol: "006208", name: "FUBON ASSET MANAGEMENT", market: "TW", shares: 4000, market_value: 978200, currency: "TWD", classification: "core" },
    { inst: "富邦金控(台灣)", symbol: "2881", name: "FUBON FINANCIAL HLDG", market: "TW", shares: 3000, market_value: 340500, currency: "TWD", classification: "core" },
    { inst: "富邦金控(台灣)", symbol: "2884", name: "E SUN FINANCIAL HOLDINGS", market: "TW", shares: 4000, market_value: 128800, currency: "TWD", classification: "core" },
    // Firstrade — 美股
    { inst: "Firstrade", symbol: "ARKG", name: "ARK Genomic Revolution ETF", market: "US", shares: 2, market_value: 69.50, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "CLSK", name: "CleanSpark, Inc.", market: "US", shares: 50, market_value: 940.50, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "AAPL", name: "Apple Inc.", market: "US", shares: 43, market_value: 13171.33, currency: "USD", classification: "core" },
    { inst: "Firstrade", symbol: "CRWV", name: "CoreWeave, Inc.", market: "US", shares: 4, market_value: 499.28, currency: "USD", classification: "growth" },
    { inst: "Firstrade", symbol: "ENPH", name: "Enphase Energy, Inc.", market: "US", shares: 10, market_value: 637.40, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "FLNC", name: "Fluence Energy, Inc.", market: "US", shares: 30, market_value: 814.50, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "GOOG", name: "Alphabet Inc.", market: "US", shares: 5, market_value: 1862.90, currency: "USD", classification: "growth" },
    { inst: "Firstrade", symbol: "IREN", name: "IREN LIMITED", market: "US", shares: 15, market_value: 979.95, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "MRVL", name: "Marvell Technology, Inc.", market: "US", shares: 10, market_value: 2194.30, currency: "USD", classification: "growth" },
    { inst: "Firstrade", symbol: "NBIS", name: "Nebius Group N.V.", market: "US", shares: 2, market_value: 529.02, currency: "USD", classification: "growth" },
    { inst: "Firstrade", symbol: "TSLA", name: "Tesla, Inc.", market: "US", shares: 20, market_value: 8317.60, currency: "USD", classification: "core" },
    { inst: "Firstrade", symbol: "RIOT", name: "Riot Platforms, Inc.", market: "US", shares: 20, market_value: 565.00, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "PRNT", name: "3D Printing (The) ETF", market: "US", shares: 10, market_value: 264.40, currency: "USD", classification: "speculative" },
    { inst: "Firstrade", symbol: "PLTR", name: "Palantir Technologies Inc.", market: "US", shares: 10, market_value: 1606.50, currency: "USD", classification: "growth" },
    { inst: "Firstrade", symbol: "NVDA", name: "NVIDIA Corporation", market: "US", shares: 150, market_value: 33654.00, currency: "USD", classification: "core" },
    { inst: "Firstrade", symbol: "NVAX", name: "Novavax, Inc.", market: "US", shares: 5, market_value: 52.55, currency: "USD", classification: "speculative" },
];

export const FUNDS: Fund[] = [
    { inst: "玉山金控", fund_code: "BB39", name: "安聯收益成長 AM 穩定月收 美元", market_value: 32552, currency: "TWD" },
];

export const POLICIES: Policy[] = [
    { inst: "國泰人壽", policy_name: "萬美利", policy_type: "利變美元壽險", current_value: 17220, currency: "USD" },
    { inst: "國泰人壽", policy_name: "祿美鑫", policy_type: "利變美元壽險", current_value: 30234, currency: "USD" },
];

export const SUBSCRIPTIONS: Subscription[] = [
    { service_name: "Youtube Premium", amount: 179, currency: "TWD", cycle: "monthly", category: "影音" },
    { service_name: "騰訊視頻", amount: 25, currency: "CNY", cycle: "monthly", category: "影音" },
    { service_name: "Apple One", amount: 365, currency: "TWD", cycle: "monthly", category: "雲端" },
    { service_name: "ChatGPT Plus", amount: 20, currency: "USD", cycle: "monthly", category: "AI" },
    { service_name: "iCloud+", amount: 90, currency: "TWD", cycle: "monthly", category: "雲端" },
    { service_name: "Adobe Creative Cloud", amount: 654, currency: "TWD", cycle: "monthly", category: "工具" },
    { service_name: "Anthropic Claude", amount: 20, currency: "USD", cycle: "monthly", category: "AI" },
    { service_name: "Google One (1)", amount: 65, currency: "TWD", cycle: "monthly", category: "雲端" },
    { service_name: "Google One (2)", amount: 65, currency: "TWD", cycle: "monthly", category: "雲端" },
    { service_name: "DramaBOX", amount: 90, currency: "TWD", cycle: "monthly", category: "影音" },
    { service_name: "Perplexity Pro", amount: 20, currency: "USD", cycle: "monthly", category: "AI" },
    { service_name: "BiliBili 大會員", amount: 15, currency: "CNY", cycle: "monthly", category: "影音" },
    { service_name: "百度網盤", amount: 182, currency: "CNY", cycle: "yearly", category: "雲端" },
    { service_name: "Disney+", amount: 270, currency: "TWD", cycle: "monthly", category: "影音" },
    { service_name: "BioRender", amount: 35, currency: "USD", cycle: "monthly", category: "工具" },
];
