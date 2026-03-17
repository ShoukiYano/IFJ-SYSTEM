const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "yanopitrombone@gmail.com" },
    include: { tenant: true }
  });
  console.log("Current User Status:");
  console.log(`- Email: ${user.email}`);
  console.log(`- Role: ${user.role}`);
  console.log(`- TenantID: ${user.tenantId}`);
  console.log(`- Subdomain: ${user.tenant?.subdomain}`);
  console.log(`- hasAttendanceFeature: ${user.tenant?.hasAttendanceFeature}`);
  console.log(`- hasInvoiceFeature: ${user.tenant?.hasInvoiceFeature}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
