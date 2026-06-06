// 靜態 Demo Mode 版本 — 真實持股明細（供「前十大持股佔比」模組使用）
import { REAL_DATA } from "@/lib/realData";

export interface Holding {
    id: string;
    ticker: string;
    name: string;
    shares: number;
    costPrice: number;     // 此處用「市值 / 股數」反推，使前端 valueTwd 直接等於真實市值
    currency: string;      // 一律以 TWD 計價（市值已換算）
    owner: string;
    assetType: string;
    valueTwd: number;
}

const HOLDINGS: Holding[] = REAL_DATA.holdings.map((h, i) => ({
    id: `h${i}`,
    ticker: h.symbol,
    name: h.name,
    // 前端以 price(=costPrice) × shares × fx(TWD=1) 計算市值；
    // 為了讓無即時報價時也精準呈現真實市值，將 costPrice 設為 市值/股數，currency 設 TWD。
    costPrice: h.shares > 0 ? h.valueTwd / h.shares : h.valueTwd,
    currency: "TWD",
    owner: h.category,
    assetType: "stock",
    valueTwd: h.valueTwd,
}));

export async function getHoldings(): Promise<Holding[]> {
    return HOLDINGS;
}
