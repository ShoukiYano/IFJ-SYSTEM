const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // ユーザー設定 (初期管理者)
  const hashedPassword = await bcrypt.hash("drive1001", 10);
  await prisma.user.upsert({
    where: { email: "drive@example.com" },
    update: {},
    create: {
      email: "drive@example.com",
      name: "管理者",
      password: hashedPassword,
    },
  });

  // 自社情報
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "サンプル株式会社",
      zipCode: "100-0001",
      address: "東京都千代田区千代田1-1-1",
      tel: "03-1234-5678",
      registrationNumber: "T1234567890123",
      bankName: "サンプル銀行",
      bankBranch: "本店",
      bankAccountType: "普通",
      bankAccountNumber: "1234567",
      bankAccountName: "サンプル（カ",
    },
  });

  // 取引先
  const client = await prisma.client.create({
    data: {
      name: "株式会社テクノコア",
      department: "開発部",
      manager: "佐藤 様",
      zipCode: "150-0002",
      address: "東京都渋谷区渋谷2-24-12",
      tel: "03-9876-5432",
      email: "sato@example.com",
    },
  });

  console.log("Seed data created!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
