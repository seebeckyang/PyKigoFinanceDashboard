import * as XLSX from "xlsx";

// 產生 5 種 sheet 的匯入範本：accounts / holdings / funds / insurances / subscriptions
const wb = XLSX.utils.book_new();

const sheets = {
    accounts: [
        { 機構名稱: "玉山銀行", 機構類型: "銀行", 帳戶名稱: "主要活存", 幣別: "TWD", 餘額: 1200000, 持有人: "CY" },
        { 機構名稱: "Firstrade", 機構類型: "券商", 帳戶名稱: "美股複委託", 幣別: "USD", 餘額: 35000, 持有人: "HY" },
    ],
    holdings: [
        { 代號: "NVDA", 名稱: "Nvidia Corp", 股數: 1200, 平均成本: 95.0, 幣別: "USD", 持有人: "CY", 策略分類: "成長動能 (科技股)" },
        { 代號: "TPE:2330", 名稱: "台積電", 股數: 8000, 平均成本: 880, 幣別: "TWD", 持有人: "HY", 策略分類: "核心持股 (大型股)" },
    ],
    funds: [
        { 基金平台: "基富通", 基金名稱: "聯博全球非投等債", 投資金額: 500000, 幣別: "TWD", 持有人: "Both", 年化報酬率: 6.5 },
    ],
    insurances: [
        { 保險公司: "國泰人壽", 保單名稱: "美元利變壽險", 年繳保費: 120000, 幣別: "USD", 被保險人: "CY", 保額: 100000 },
    ],
    subscriptions: [
        { 服務名稱: "Netflix", 月費: 390, 幣別: "TWD", 付款人: "Both", 週期: "月" },
        { 服務名稱: "iCloud+", 月費: 90, 幣別: "TWD", 付款人: "CY", 週期: "月" },
    ],
};

for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
}

XLSX.writeFile(wb, "public/template.xlsx");
console.log("template.xlsx generated with sheets:", Object.keys(sheets).join(", "));
