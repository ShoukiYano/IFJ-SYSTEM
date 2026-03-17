const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      password: true,
    }
  });
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}) Tenant: ${u.tenantId || "NONE"} PasswordSet: ${!!u.password}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
