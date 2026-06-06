// 靜態 Demo Mode — 移除後端 Gemini 解析，提供相容空殼。
import { Expense } from "@/types/expenses";

export async function parseInvoice(_input: string | Buffer, _isImage: boolean = false): Promise<Partial<Expense>> {
    // Demo Mode 不連接後端 AI；回傳空物件即可。
    return {};
}
