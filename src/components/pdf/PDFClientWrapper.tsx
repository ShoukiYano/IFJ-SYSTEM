"use client";

import React from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import { OrderDocument } from "@/components/pdf/OrderDocument";
import { OrderConfirmationDocument } from "@/components/pdf/OrderConfirmationDocument";
import { Download, FileText, Loader2 } from "lucide-react";

interface PDFPreviewProps {
  invoice: any;
  company: any;
  showPreview?: boolean;
}

const PDFActionButtons: React.FC<PDFPreviewProps> = ({ invoice, company }) => {
  const dateStr = invoice.issueDate.split('-').slice(0, 2).join('');
  const clientName = invoice.client?.name || "Unknown";

  return (
    <div className="flex bg-blue-600 rounded-lg shadow-md overflow-hidden">
      <PDFDownloadLink 
        document={<InvoiceDocument invoice={invoice} company={company} />} 
        fileName={`${dateStr}_${clientName}_請求書_${invoice.invoiceNumber}.pdf`}
        className="text-white px-4 py-2 font-bold flex items-center gap-2 hover:bg-blue-700 transition-all border-r border-blue-500"
      >
        {((props: any) => (
          <span className="flex items-center gap-2">
            {props.loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            請求書
          </span>
        )) as any}
      </PDFDownloadLink>

      <PDFDownloadLink 
        document={<OrderDocument invoice={invoice} company={company} />} 
        fileName={`${dateStr}_${clientName}_注文書_${invoice.invoiceNumber}.pdf`}
        className="text-white px-4 py-2 font-bold flex items-center gap-2 hover:bg-blue-700 transition-all border-r border-blue-500"
      >
        {((props: any) => (
          <span className="flex items-center gap-2">
            {props.loading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            注文書
          </span>
        )) as any}
      </PDFDownloadLink>

      <PDFDownloadLink 
        document={<OrderConfirmationDocument invoice={invoice} company={company} />} 
        fileName={`${dateStr}_${clientName}_注文請書_${invoice.invoiceNumber}.pdf`}
        className="text-white px-4 py-2 font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
      >
        {((props: any) => (
          <span className="flex items-center gap-2">
            {props.loading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            注文請書
          </span>
        )) as any}
      </PDFDownloadLink>
    </div>
  );
};

export const PDFPreviewSection: React.FC<PDFPreviewProps> = ({ invoice, company, showPreview }) => {
  if (!showPreview) return null;

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-lg font-bold mb-4">PDFプレビュー</h2>
      <div className="bg-slate-200 rounded-xl overflow-hidden" style={{ height: '800px' }}>
        <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
          <InvoiceDocument invoice={invoice} company={company} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PDFActionButtons;
