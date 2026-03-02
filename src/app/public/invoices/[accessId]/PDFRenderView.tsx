"use client";

import React from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

interface PDFRenderViewProps {
    invoice: any;
    company: any;
}

export const PDFRenderView: React.FC<PDFRenderViewProps> = ({ invoice, company }) => {
    const filename = `請求書_${invoice.invoiceNumber}.pdf`;

    return (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
            <div className="bg-gray-800 p-4 flex items-center justify-between text-white">
                <h2 className="font-semibold truncate mr-4">
                    {invoice.invoiceNumber} - {invoice.client.name}
                </h2>
                <PDFDownloadLink
                    document={<InvoiceDocument invoice={invoice} company={company} />}
                    fileName={filename}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {((props: any) =>
                        props.loading ? "準備中..." : "PDFを保存する"
                    ) as any}
                </PDFDownloadLink>
            </div>

            <div className="flex-1 bg-gray-200">
                <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                    <InvoiceDocument invoice={invoice} company={company} />
                </PDFViewer>
            </div>
        </div>
    );
};
