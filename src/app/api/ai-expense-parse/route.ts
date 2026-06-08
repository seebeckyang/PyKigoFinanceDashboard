// /api/ai-expense-parse
// 把自然語言 / 語音轉文字結果切成結構化記帳:
//   { merchant, amount, currency, category, note, occurred_at }
//
// 策略:純規則 + 幣別偵測,不依賴外部 LLM(零成本、零延遲、不需要 API key)
// 之後可以選擇升級為 Perplexity sonar / OpenAI 解析

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Parsed = {
    merchant?: string;
    amount?: number;
    currency?: string;
    category?: string;
    note?: string;
    occurred_at?: string;
    raw: string;
    confidence: number;
};

// 幣別偵測表:符號 / 縮寫 / 中文名
const CURRENCY_PATTERNS: Array<{ re: RegExp; code: string }> = [
    { re: /(?:NT\$|台幣|新台幣|TWD)\s*([\d,]+(?:\.\d+)?)/i, code: "TWD" },
    { re: /(?:US\$|美元|美金|USD)\s*([\d,]+(?:\.\d+)?)/i, code: "USD" },
    { re: /(?:US\$|美元|美金|USD)?\s*([\d,]+(?:\.\d+)?)\s*(?:美元|美金|USD|US\$)/i, code: "USD" },
    { re: /(?:¥|人民幣|RMB|CNY)\s*([\d,]+(?:\.\d+)?)/i, code: "CNY" },
    { re: /([\d,]+(?:\.\d+)?)\s*(?:人民幣|RMB|CNY|塊錢|塊)/i, code: "CNY" },
    { re: /(?:€|歐元|EUR)\s*([\d,]+(?:\.\d+)?)/i, code: "EUR" },
    { re: /([\d,]+(?:\.\d+)?)\s*(?:歐元|EUR)/i, code: "EUR" },
    { re: /(?:¥|日圓|日幣|JPY)\s*([\d,]+(?:\.\d+)?)/i, code: "JPY" },
    { re: /([\d,]+(?:\.\d+)?)\s*(?:日圓|日幣|JPY)/i, code: "JPY" },
    { re: /(?:HK\$|港幣|港元|HKD)\s*([\d,]+(?:\.\d+)?)/i, code: "HKD" },
    { re: /([\d,]+(?:\.\d+)?)\s*(?:港幣|港元|HKD)/i, code: "HKD" },
    // 預設 NT$
    { re: /([\d,]+(?:\.\d+)?)\s*(?:元|塊)/i, code: "TWD" },
];

const CATEGORY_HINTS: Array<{ re: RegExp; cat: string }> = [
    { re: /(?:午|晚|早)餐|吃|喝|餐廳|cafe|咖啡|星巴克|麥當勞|肯德基|路易莎|火鍋|拉麵|便當/i, cat: "餐飲" },
    { re: /uber|計程車|taxi|捷運|高鐵|火車|公車|油|加油|停車|交通/i, cat: "交通" },
    { re: /momo|shopee|amazon|淘寶|京東|costco|家樂福|超市|超商|7-?11|全家|衣服|鞋/i, cat: "購物" },
    { re: /電費|水費|瓦斯|電信|手機|寬頻|wifi|租金|房租/i, cat: "居家" },
    { re: /醫|藥|診所|健保|保險/i, cat: "健康" },
    { re: /電影|演唱會|遊戲|netflix|spotify|youtube|disney/i, cat: "娛樂" },
    { re: /學費|補習|書|課程|kindle/i, cat: "教育" },
];

function parseOne(text: string): Parsed {
    const raw = text.trim();
    let amount: number | undefined;
    let currency: string | undefined;
    let cleaned = raw;

    // 幣別 + 金額
    for (const { re, code } of CURRENCY_PATTERNS) {
        const m = raw.match(re);
        if (m) {
            amount = Number(m[1].replace(/,/g, ""));
            currency = code;
            cleaned = raw.replace(m[0], "").trim();
            break;
        }
    }

    // 如果沒匹配到幣別,但有純數字 → 預設 TWD
    if (amount === undefined) {
        const m = raw.match(/([\d,]+(?:\.\d+)?)/);
        if (m) {
            amount = Number(m[1].replace(/,/g, ""));
            currency = "TWD";
            cleaned = raw.replace(m[0], "").trim();
        }
    }

    // 分類
    let category: string | undefined;
    for (const { re, cat } of CATEGORY_HINTS) {
        if (re.test(raw)) { category = cat; break; }
    }

    // 商家:取最長中文 / 英數連續 chunk(去掉金額與分類關鍵字後)
    const merchantMatch = cleaned.replace(/[在於買吃喝花付了用，。,.\s]+/g, " ").trim().split(/\s+/).filter(s => s.length >= 2)[0];

    // 時間:支援「今天/昨天/前天」
    const now = new Date();
    let occurred = now.toISOString().slice(0, 10);
    if (/昨天/.test(raw)) occurred = new Date(now.getTime() - 86400_000).toISOString().slice(0, 10);
    else if (/前天/.test(raw)) occurred = new Date(now.getTime() - 2 * 86400_000).toISOString().slice(0, 10);

    let confidence = 0;
    if (amount !== undefined) confidence += 0.5;
    if (currency) confidence += 0.2;
    if (category) confidence += 0.2;
    if (merchantMatch) confidence += 0.1;

    return {
        merchant: merchantMatch,
        amount,
        currency,
        category,
        note: raw,
        occurred_at: occurred,
        raw,
        confidence,
    };
}

export async function POST(req: NextRequest) {
    let body: any = {};
    try { body = await req.json(); } catch { }
    const text = String(body?.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "缺少 text" }, { status: 400 });

    // 支援多筆:每行 / 每段 分開
    const lines = text.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
    const parsed = lines.map(parseOne);

    return NextResponse.json({ count: parsed.length, items: parsed });
}
