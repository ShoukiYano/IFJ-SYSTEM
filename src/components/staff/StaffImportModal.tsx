"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface StaffImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffImportModal({ isOpen, onClose, onSuccess }: StaffImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number; errors?: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/staff/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message, count: data.count, errors: data.errors });
        onSuccess();
      } else {
        setResult({ success: false, message: data.error || "インポートに失敗しました" });
      }
    } catch (error) {
      setResult({ success: false, message: "通信エラーが発生しました" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Excelインポート</h2>
            <p className="text-slate-500 text-sm mt-1">要員管理シート（Excel）から一括登録します</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8">
          {!result ? (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                  file ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <div className="size-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Upload size={32} />
                </div>
                {file ? (
                  <div>
                    <p className="text-blue-600 font-bold">{file.name}</p>
                    <p className="text-slate-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-700 font-bold">クリックしてファイルを選択</p>
                    <p className="text-slate-400 text-xs mt-1">またはファイルをここにドロップ (Excelのみ)</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!file || isUploading}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : <FileDown size={24} />}
                  インポート実行
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              {result.success ? (
                <>
                  <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">インポート成功</h3>
                  <p className="text-slate-600 font-medium mb-8">
                    {result.count}名の要員情報をインポートしました。
                  </p>
                  
                  {result.errors && result.errors.length > 0 && (
                    <div className="mb-8 text-left max-h-40 overflow-y-auto bg-rose-50 p-4 rounded-xl border border-rose-100">
                      <p className="text-rose-700 font-bold text-xs uppercase mb-2">エラーが発生した行:</p>
                      <ul className="space-y-1">
                        {result.errors.map((err, idx) => (
                          <li key={idx} className="text-xs text-rose-600">
                            行 {err.row}: {err.name} - {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="size-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-6">
                    <AlertCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">インポート失敗</h3>
                  <p className="text-slate-600 mb-8">{result.message}</p>
                </>
              )}
              <button 
                onClick={onClose}
                className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                閉じる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
