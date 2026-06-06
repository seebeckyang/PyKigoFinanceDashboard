// 靜態 Demo Mode — AI 財務洞察（預先產生的真實資產摘要，無需後端）
import { REAL_DATA } from "@/lib/realData";

const fmt = (n: number) => "NT$" + Math.round(n).toLocaleString();

const REAL_SUMMARY =
    `截至 2026/02，您的家庭總資產淨值為 ${fmt(REAL_DATA.grandTotal)}，` +
    `其中股票部位 ${fmt(REAL_DATA.stockTotal)}（佔約 ${(REAL_DATA.stockTotal / REAL_DATA.grandTotal * 100).toFixed(0)}%）。` +
    `資產配置上核心持股約 54.7%、定存與現金約 41.6%，結構穩健、防禦性佳。` +
    `提醒：NVDA 與 006208（富邦台50）各佔總資產逾 10%，已亮起 🟡 黃燈集中度提醒，` +
    `若單一標的續漲建議留意是否超過 15% 的橘燈門檻。` +
    `每月固定訂閱支出為 ${fmt(REAL_DATA.subscriptionsMonthlyTotal)}，可於訂閱頁檢視年付續費提醒。`;

export async function generateLiveAISummary(_dashboardData?: any, _userFeedback?: string): Promise<string> {
    return REAL_SUMMARY;
}
