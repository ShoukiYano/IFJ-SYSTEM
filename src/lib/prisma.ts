import { PrismaClient } from "@prisma/client";
import { getTenantId } from "./tenantStore";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
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

          return query(args);
        },
      },
    },
  });
};

type PrismaClientExtended = ReturnType<typeof prismaClientSingleton>;

declare global {
  var prisma: undefined | PrismaClientExtended;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma as PrismaClientExtended;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
