"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileText, Download, Archive, ChevronLeft, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { cn } from "@/lib/utils";

interface ExcelSheet {
  name: string;
  csv: string;
  rowCount: number;
}

export default function ExcelConverterPage() {
  const [sheets, setSheets] = useState<ExcelSheet[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setError(null);
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Excelファイル（.xlsx または .xls）を選択してください。");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const newSheets: ExcelSheet[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // CSVに変換
          const csv = XLSX.utils.sheet_to_csv(worksheet, { strip: false });
          // 行数をカウント（空行を除外）
          const rows = XLSX.utils.sheet_to_json(worksheet);
          
          if (rows.length > 0) {
            newSheets.push({
              name: sheetName,
              csv: csv,
              rowCount: rows.length,
            });
          }
        });

        if (newSheets.length === 0) {
          setError("ファイルに有効なデータを含むシートが見つかりませんでした。");
        } else {
          setSheets(newSheets);
        }
      } catch (err) {
        console.error(err);
        setError("ファイルの読み込み中にエラーが発生しました。");
      }
    };
    reader.readAsBinaryString(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const downloadCSV = (sheet: ExcelSheet) => {
    const blob = new Blob([sheet.csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${sheet.name}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    sheets.forEach((sheet) => {
      zip.file(`${sheet.name}.csv`, sheet.csv);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    const zipUrl = URL.createObjectURL(content);
    link.setAttribute("href", zipUrl);
    link.setAttribute("download", `${fileName.split('.')[0]}_CSVs.zip`);
    link.click();
    URL.revokeObjectURL(zipUrl);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <a href="/invoices/new" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium mb-2 transition-colors">
            <ChevronLeft size={16} /> 請求書作成に戻る
          </a>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Excel → CSV 変換ツール</h2>
          <p className="text-slate-500">Excelのシートを企業ごとのCSVファイルに変換します。</p>
        </div>
      </div>

      {/* アップロードエリア */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer",
          isDragging ? "border-blue-500 bg-blue-50/50 scale-[0.99]" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50",
          sheets.length > 0 && "py-8"
        )}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <input
          id="fileInput"
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-5 rounded-2xl shadow-sm transition-all",
            sheets.length > 0 ? "bg-emerald-100 text-emerald-600 scale-90" : "bg-blue-600 text-white shadow-blue-200 shadow-xl"
          )}>
            {sheets.length > 0 ? <CheckCircle2 size={32} /> : <Upload size={32} />}
          </div>
          <div>
            <p className="font-black text-lg text-slate-800">
              {fileName || "Excelファイルをドラッグ＆ドロップ"}
            </p>
            <p className="text-slate-500 text-sm mt-1">またはクリックしてファイルを選択してください</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          {error}
        </div>
      )}

      {/* シート一覧 */}
      {sheets.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={22} className="text-blue-500" />
              抽出されたシート一覧 ({sheets.length})
            </h3>
            <button
              onClick={downloadAllAsZip}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
            >
              <Archive size={18} />
              一括ダウンロード (ZIP)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sheets.map((sheet, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 break-all">{sheet.name}</div>
                      <div className="text-xs text-slate-400 mt-1 font-medium">{sheet.rowCount} 件のデータ</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadCSV(sheet); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="CSVをダウンロード"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h4 className="text-blue-900 font-bold mb-2 text-sm flex items-center gap-2">
              <FileText size={16} /> 使い方
            </h4>
            <ol className="text-blue-800 text-xs space-y-2 list-decimal list-inside leading-relaxed">
              <li>ダウンロードしたCSVファイルを、請求書作成画面の「勤怠データ読込 (CSV)」で使用してください。</li>
              <li>シート名がそのまま取引先名（ファイル名）として保存されます。</li>
              <li>シート内の1行目はヘッダーとして扱われます（No, 年月, 名前, 単価, 時間, 精算幅 など）。</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
