"use client";

import React, { useState } from "react";
import { Download, Loader2, Archive, Check } from "lucide-react";
import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

interface BulkZipDownloadProps {
  yearMonth: string; // e.g. "2024-09"
}

export const BulkZipDownload: React.FC<BulkZipDownloadProps> = ({ yearMonth }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "fetching" | "generating" | "completed">("idle");

  const handleDownload = async () => {
    setIsGenerating(true);
    setStatus("fetching");
    setProgress(0);

    try {
      // 1. Fetch all invoices for the month
      const res = await fetch(`/api/invoices?month=${yearMonth}`);
      const invoices = await res.json();
      
      if (!Array.isArray(invoices) || invoices.length === 0) {
        alert("該当する月の請求書が見つかりませんでした。");
        setIsGenerating(false);
        setStatus("idle");
        return;
      }

      setTotal(invoices.length);
      setStatus("generating");

      // 2. Fetch company info (assuming it's needed for the PDF)
      const compRes = await fetch("/api/company");
      const company = await compRes.json();

      const zip = new JSZip();

      // 3. Generate each PDF and add to ZIP
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        const clientName = invoice.client?.name || "Unknown";
        
        // フォルダ分け用パス: "取引先名/YYYYMM_取引先名_請求書_番号.pdf"
        const folderName = clientName.replace(/[\\/:*?"<>|]/g, "_");
        const fileName = `${invoice.issueDate.split("-").slice(0, 2).join("")}_${clientName}_請求書_${invoice.invoiceNumber}.pdf`;
        
        // PDFの生成 (Blob)
        const blob = await pdf(<InvoiceDocument invoice={invoice} company={company} />).toBlob();
        
        // ZIPに追加
        zip.file(`${folderName}/${fileName}`, blob);
        
        setProgress(i + 1);
      }

      // 4. Generate ZIP file and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `請求書一括_${yearMonth}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus("completed");
      setTimeout(() => {
        setIsGenerating(false);
        setStatus("idle");
      }, 3000);

    } catch (err) {
      console.error(err);
      alert("ZIPの生成中にエラーが発生しました。");
      setIsGenerating(false);
      setStatus("idle");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md ${
          status === "completed" 
            ? "bg-emerald-500 text-white" 
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        } disabled:opacity-70`}
      >
        {status === "idle" && <Archive size={18} />}
        {status === "fetching" && <Loader2 size={18} className="animate-spin" />}
        {status === "generating" && <Loader2 size={18} className="animate-spin" />}
        {status === "completed" && <Check size={18} />}
        
        {status === "idle" && "一括ZIPダウンロード"}
        {status === "fetching" && "データ取得中..."}
        {status === "generating" && `作成中 (${progress}/${total})`}
        {status === "completed" && "ダウンロード完了"}
      </button>
    </div>
  );
};
