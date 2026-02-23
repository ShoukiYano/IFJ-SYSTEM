"use client";

import React from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import { Download, Loader2 } from "lucide-react";

interface QuotationPDFProps {
  quotation: any;
  company: any;
  showPreview?: boolean;
}

const QuotationPDFDownload: React.FC<QuotationPDFProps> = ({ quotation, company }) => {
  return (
    <PDFDownloadLink
      document={<QuotationDocument quotation={quotation} company={company} />}
      fileName={`${quotation.quotationNumber}.pdf`}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md"
    >
      {((props: any) => (
        <span className="flex items-center gap-2">
          {props.loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          PDFダウンロード
        </span>
      )) as any}
    </PDFDownloadLink>
  );
};

export const QuotationPDFPreview: React.FC<QuotationPDFProps> = ({ quotation, company, showPreview }) => {
  if (!showPreview) return null;

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-lg font-bold mb-4">PDFプレビュー</h2>
      <div className="bg-slate-200 rounded-xl overflow-hidden" style={{ height: '800px' }}>
        <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
          <QuotationDocument quotation={quotation} company={company} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default QuotationPDFDownload;
