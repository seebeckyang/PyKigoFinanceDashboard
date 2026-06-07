// 持股明細資料層 — Supabase 正式版優先，未設定時 fall back 到本地真實資料（Demo）
import { REAL_DATA } from "@/lib/realData";
import { fetchLiveHoldings } from "@/lib/liveData";

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

// 把 Supabase holdings（原幣別 value）轉成前端 Holding 結構。
// value 為原幣別市值，這裡先用 REAL_DATA 的匯率換算成 TWD 顯示基準；
// 之後 useLiveMarket 會再用即時報價覆蓋。
function mapLiveToHolding(rows: any[]): Holding[] {
    const fx = (REAL_DATA as any).fx ?? 31;
    const cny = (REAL_DATA as any).cny ?? 4.3;
    return rows.map((r, i) => {
        const rate = r.currency === "USD" ? fx : r.currency === "CNY" ? cny : 1;
        const valueTwd = Math.round((Number(r.value) || 0) * rate);
        const shares = Number(r.shares) || 0;
        return {
            id: `h${i}`,
            ticker: r.symbol,
            name: r.name ?? r.symbol,
            costPrice: shares > 0 ? valueTwd / shares : valueTwd,
            currency: "TWD",
            owner: r.category ?? "核心",
            assetType: "stock",
            valueTwd,
        };
    });
}

// 非同步版：Supabase 已設定且有資料時回傳正式資料，否則回傳本地真實資料。
export async function getHoldings(): Promise<Holding[]> {
    const live = await fetchLiveHoldings();
    if (live && live.length > 0) return mapLiveToHolding(live);
    return HOLDINGS;
}

// 同步版：供靜態頁面首次 render 即取得資料（避免 async 水合問題）。
// 一律回傳本地真實資料作為「首屏」，掛載後再由 getHoldings() 取代為正式資料。
export function getHoldingsSync(): Holding[] {
    return HOLDINGS;
}
