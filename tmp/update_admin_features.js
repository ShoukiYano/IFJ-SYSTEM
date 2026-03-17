const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // SYSTEM_ADMIN が所属するテナントを特定
  const user = await prisma.user.findFirst({
    where: { email: "yanopitrombone@gmail.com" },
    include: { tenant: true }
  });

  if (user && user.tenantId) {
    console.log(`Updating tenant ${user.tenantId} (${user.tenant?.name})...`);
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        hasAttendanceFeature: true,
        hasInvoiceFeature: true
      }
    });
    console.log("Success: Feature flags updated.");
  } else {
    console.log("User or Tenant not found.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
