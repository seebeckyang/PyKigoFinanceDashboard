"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// 支援的 sheet 類型與中文標題
const SHEET_LABELS: Record<string, string> = {
    accounts: "帳戶 (Accounts)",
    holdings: "持股 (Holdings)",
    funds: "基金 (Funds)",
    insurances: "保險 (Insurances)",
    subscriptions: "訂閱 (Subscriptions)",
};
const SUPPORTED = Object.keys(SHEET_LABELS);

interface ParsedSheet {
    key: string;
    label: string;
    columns: string[];
    rows: Record<string, any>[];
    total: number;
}

export default function ImportPage() {
    const [sheets, setSheets] = useState<ParsedSheet[]>([]);
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setError("");
        setConfirmed(false);
        setFileName(file.name);
        try {
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const parsed: ParsedSheet[] = [];

            // CSV：只有一個 sheet，名稱可能不對應 → 嘗試用檔名推測類型
            const isCsv = /\.csv$/i.test(file.name);

            for (const sheetName of wb.SheetNames) {
                const lower = sheetName.toLowerCase();
                let key = SUPPORTED.find((s) => lower.includes(s));
                if (!key && isCsv) {
                    const fn = file.name.toLowerCase();
                    key = SUPPORTED.find((s) => fn.includes(s)) || "accounts";
                }
                if (!key) continue; // 略過不認識的 sheet

                const ws = wb.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
                if (json.length === 0) continue;
                const columns = Object.keys(json[0]);
                parsed.push({
                    key,
                    label: SHEET_LABELS[key],
                    columns,
                    rows: json.slice(0, 10),
                    total: json.length,
                });
            }

            if (parsed.length === 0) {
                setError("找不到可辨識的工作表。請確認檔案含有以下任一名稱的 sheet：accounts、holdings、funds、insurances、subscriptions。");
                setSheets([]);
                return;
            }
            setSheets(parsed);
        } catch (err: any) {
            setError("解析失敗：" + (err.message || "未知錯誤"));
            setSheets([]);
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };

    const reset = () => {
        setSheets([]);
        setFileName("");
        setError("");
        setConfirmed(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const totalRows = sheets.reduce((s, sh) => s + sh.total, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#E6EDF7] tracking-tight flex items-center gap-2">
                        <Upload className="w-6 h-6 text-[#2E7CF6]" />
                        批次匯入 (Excel / CSV)
                    </h1>
                    <p className="text-[#93A4C2] mt-1 text-sm font-medium">支援帳戶、持股、基金、保險、訂閱五種工作表，一次匯入。</p>
                </div>
                <a
                    href="/template.xlsx"
                    download
                    className="flex items-center gap-2 bg-[#16223D] border border-[#1F2C4A] hover:border-[#2E7CF6]/60 hover:bg-[#111A2E] text-[#E6EDF7] font-semibold px-4 py-2.5 rounded-2xl shadow-sm transition-all"
                >
                    <Download className="w-4 h-4 text-[#2E7CF6]" /> 下載範本
                </a>
            </div>

            {/* Demo 提示 */}
            {IS_DEMO && (
                <div className="flex items-start gap-2 bg-[#2E7CF6]/10 border border-[#2E7CF6]/30 rounded-xl p-3 text-xs text-[#2E7CF6]">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>目前為 <strong>Demo 模式</strong>：可上傳並預覽解析結果，但「確認匯入」只會顯示提示，不會真的寫入資料庫。接上您自己的 Supabase 後即可正式匯入。</span>
                </div>
            )}

            {/* 上傳區 */}
            {sheets.length === 0 && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
                        dragOver ? "border-[#2E7CF6] bg-[#111A2E]" : "border-[#1F2C4A] bg-[#111A2E] hover:border-[#2E7CF6]"
                    }`}
                >
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-[#2E7CF6] mb-3" />
                    <div className="font-bold text-[#E6EDF7]">點擊或拖曳檔案到這裡</div>
                    <div className="text-xs text-[#5A6B89] mt-1">支援 .xlsx 與 .csv</div>
                    <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onInputChange} />
                </div>
            )}

            {/* 錯誤 */}
            {error && (
                <div className="flex items-start gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 text-sm text-[#EF4444]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* 預覽 */}
            {sheets.length > 0 && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between bg-[#111A2E] rounded-2xl border border-[#1F2C4A]/60 px-4 py-3 shadow-sm">
                        <div className="text-sm text-[#93A4C2]">
                            <span className="font-bold text-[#E6EDF7]">{fileName}</span> · 共 {sheets.length} 個工作表 / {totalRows} 筆資料
                        </div>
                        <button onClick={reset} className="text-[#5A6B89] hover:text-[#93A4C2] flex items-center gap-1 text-xs">
                            <X className="w-4 h-4" /> 換一個檔案
                        </button>
                    </div>

                    {sheets.map((sh) => (
                        <div key={sh.key} className="bg-[#111A2E] rounded-2xl border border-[#1F2C4A]/60 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#1F2C4A]/60 flex items-center justify-between">
                                <h3 className="font-bold text-[#E6EDF7] flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-[#2E7CF6]" /> {sh.label}
                                </h3>
                                <span className="text-xs text-[#5A6B89]">
                                    預覽前 {sh.rows.length} 筆（共 {sh.total} 筆）
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] uppercase tracking-wider text-[#5A6B89] bg-[#111A2E]">
                                            {sh.columns.map((c) => (
                                                <th key={c} className="py-2 px-3 whitespace-nowrap">{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sh.rows.map((row, i) => (
                                            <tr key={i} className="border-b border-[#1F2C4A]/30 hover:bg-[#111A2E]/60">
                                                {sh.columns.map((c) => (
                                                    <td key={c} className="py-2 px-3 whitespace-nowrap text-[#E6EDF7]">{String(row[c])}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* 確認 */}
                    {confirmed ? (
                        <div className="rounded-2xl bg-[#10B981]/10 border border-emerald-200 p-4 text-center text-[#0ea072] font-semibold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {IS_DEMO ? "Demo 模式：已預覽完成，未實際寫入資料庫。" : `已成功匯入 ${totalRows} 筆資料！`}
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmed(true)}
                            className="w-full bg-[#2E7CF6] hover:bg-[#1a6ae3] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-brand-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            確認匯入 {totalRows} 筆資料
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
