import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking database connection...");
    const clientCount = await prisma.client.count();
    console.log(`Connection successful. Client count: ${clientCount}`);

    console.log("Checking Invoice model fields...");
    // @ts-ignore
    const invoice = await prisma.invoice.findFirst();
    console.log("Invoice model is accessible.");

    console.log("Checking InvoiceSequence...");
    const sequence = await prisma.invoiceSequence.upsert({
      where: { id: "default" },
      update: { current: { increment: 1 } },
      create: { id: "default", current: 1 },
    });
    console.log("Sequence upsert successful:", sequence);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
