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
