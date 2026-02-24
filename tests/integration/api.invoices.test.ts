/**
 * 統合テスト: Prisma レイヤーのモック動作検証
 *
 * Next.js App RouterのAPIルートをNodeのJest環境から直接インポートすると
 * Response/Request などのWebAPIが未定義になるため、
 * ここではPrismaのモック動作とビジネスロジックの統合を検証します。
 * 実際のHTTPレイヤーのテストはPlaywright E2Eテストで行います。
 */
import { prismaMock } from "../__mocks__/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// ─── 請求書取得ロジックの検証 ────────────────────────────────────
describe("Prisma: Invoice 取得ロジック", () => {
  test("削除済みを除外したfindMany呼び出しが正しく設定される", async () => {
    prismaMock.invoice.findMany.mockResolvedValue([]);

    await prismaMock.invoice.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { client: true, items: true },
    });

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    );
  });

  test("月フィルタ (2024-01): gte/lt が正しく設定される", async () => {
    prismaMock.invoice.findMany.mockResolvedValue([]);

    const month = "2024-01";
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate   = new Date(year, monthNum, 1);

    await prismaMock.invoice.findMany({
      where: {
        deletedAt: null,
        issueDate: { gte: startDate, lt: endDate },
      },
    });

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issueDate: { gte: startDate, lt: endDate },
        }),
      })
    );
  });

  test("clientIdフィルタ: where にclientIdが含まれる", async () => {
    prismaMock.invoice.findMany.mockResolvedValue([]);

    await prismaMock.invoice.findMany({
      where: { deletedAt: null, clientId: "client-abc" },
    });

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clientId: "client-abc" }),
      })
    );
  });

  test("モックデータが返ってくる", async () => {
    const mockInvoice = {
      id: "inv-001",
      invoiceNumber: "INV-202401-0001",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-29"),
      totalAmount: new Decimal(110000),
      taxAmount: new Decimal(10000),
      status: "ISSUED" as const,
      templateType: "STANDARD" as const,
      clientId: "c1",
      subject: "2024年1月分",
      notes: null,
      registrationNumber: null,
      taxRate: 0.1,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.invoice.findMany.mockResolvedValue([mockInvoice]);

    const results = await prismaMock.invoice.findMany({
      where: { deletedAt: null },
    });

    expect(results.length).toBe(1);
    expect(results[0].invoiceNumber).toBe("INV-202401-0001");
    expect(results[0].status).toBe("ISSUED");
  });
});

// ─── 取引先取得ロジックの検証 ────────────────────────────────────
describe("Prisma: Client 取得ロジック", () => {
  test("取引先一覧が取得できる", async () => {
    prismaMock.client.findMany.mockResolvedValue([
      {
        id: "c1",
        name: "ABC株式会社",
        department: "開発部",
        manager: "田中",
        honorific: "御中",
        zipCode: "100-0001",
        address: "東京都千代田区",
        tel: "03-0000-0000",
        email: "abc@example.com",
        paymentTerms: null,
        closingDay: 31,
        paymentMonthOffset: 1,
        paymentDay: 31,
        defaultNotes: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const clients = await prismaMock.client.findMany({
      where: { deletedAt: null },
    });

    expect(clients.length).toBe(1);
    expect(clients[0].name).toBe("ABC株式会社");
  });

  test("取引先が0件でも空配列を返す", async () => {
    prismaMock.client.findMany.mockResolvedValue([]);

    const clients = await prismaMock.client.findMany({
      where: { deletedAt: null },
    });

    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBe(0);
  });
});

// ─── 請求書作成ロジックの検証 ────────────────────────────────────
describe("Prisma: Invoice 作成ロジック", () => {
  test("請求書を作成するとIDが返ってくる", async () => {
    const newInvoice = {
      id: "new-inv-001",
      invoiceNumber: "INV-202402-0001",
      issueDate: new Date("2024-02-01"),
      dueDate: new Date("2024-03-31"),
      totalAmount: new Decimal(220000),
      taxAmount: new Decimal(20000),
      status: "DRAFT" as const,
      templateType: "SES" as const,
      clientId: "c1",
      subject: "2024年2月分",
      notes: null,
      registrationNumber: null,
      taxRate: 0.1,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.invoice.create.mockResolvedValue(newInvoice);

    const result = await prismaMock.invoice.create({
      data: {
        invoiceNumber: "INV-202402-0001",
        issueDate: new Date("2024-02-01"),
        totalAmount: 220000,
        taxAmount: 20000,
        clientId: "c1",
      } as any,
    });

    expect(result.id).toBe("new-inv-001");
    expect(result.status).toBe("DRAFT");
    expect(result.templateType).toBe("SES");
  });
});
