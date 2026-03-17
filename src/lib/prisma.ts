import { PrismaClient } from "@prisma/client";
import { getTenantId } from "./tenantStore";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          console.log(`[PRISMA] START ${model}.${operation}`);
          const tenantId = getTenantId();

          // テナント分離が必要なモデル一覧
          const tenantModels = [
            "Client",
            "Assignee",
            "Staff",
            "Quotation",
            "Invoice",
            "InvoiceSequence",
            "AuditLog",
            "TenantBackup",
            "GoogleOAuthToken",
            "EmailTemplate",
          ];

          if (tenantId && tenantModels.includes(model)) {
            const a = args as any;
            // 検索・更新系
            if (
              [
                "findFirst",
                "findMany",
                "count",
                "updateMany",
                "deleteMany",
                "aggregate",
                "groupBy",
                "update",
                "delete",
              ].includes(operation)
            ) {
              a.where = { ...a.where, tenantId };
            }

            // 作成系
            if (operation === "create") {
              a.data = { ...a.data, tenantId };
            }
            if (operation === "createMany") {
              if (Array.isArray(a.data)) {
                a.data = a.data.map((d: any) => ({ ...d, tenantId }));
              }
            }
            // upsert は where と create 両方に必要
            if (operation === "upsert") {
              a.where = { ...a.where, tenantId };
              a.create = { ...a.create, tenantId };
            }
          }

          try {
            const result = await query(args);
            console.log(`[PRISMA] END ${model}.${operation}`);
            return result;
          } catch (err) {
            console.error(`[PRISMA] ERROR ${model}.${operation}:`, err);
            throw err;
          }
        },
      },
    },
  });
};

export type PrismaClientExtended = ReturnType<typeof prismaClientSingleton>;

declare global {
  var prisma: (PrismaClientExtended & PrismaClient) | undefined;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma as unknown as PrismaClientExtended & PrismaClient;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma as any;
