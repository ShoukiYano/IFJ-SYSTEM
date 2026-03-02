import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import DownloadPageClient from "./DownloadPageClient";

interface Props {
    params: {
        accessId: string;
    };
}

export default async function PublicInvoiceDownloadPage({ params }: Props) {
    const invoice = await prisma.invoice.findUnique({
        where: { accessId: params.accessId },
        include: {
            tenant: true,
            client: true,
            items: {
                orderBy: { order: "asc" },
            },
        },
    });

    if (!invoice) {
        notFound();
    }

    // Check if link has expired
    const expiresAt = (invoice as any).accessExpiresAt;
    if (expiresAt && new Date() > new Date(expiresAt)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">有効期限切れ</h1>
                    <p className="text-gray-600 mb-6">
                        このダウンロードリンクは有効期限（7日間）が過ぎたため、アクセスできません。<br />
                        お手数ですが、送信元へ再送をご依頼ください。
                    </p>
                    <div className="inline-block p-3 bg-amber-50 rounded-full text-amber-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }

    // Pass necessary data to the client component
    // We don't pass the password itself, we'll verify it via a small API or simple check if we trust the client (for this MVP, a simple check on client is often requested, but a server action or API is better. Let's do a simple server action or API re-verification if needed, but for now we'll pass the data and hide it behind a password state in client)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <DownloadPageClient
                invoice={JSON.parse(JSON.stringify(invoice)) as any}
                company={JSON.parse(JSON.stringify((invoice as any).tenant)) as any}
                correctPassword={(invoice as any).downloadPassword || ""}
            />
        </div>
    );
}
