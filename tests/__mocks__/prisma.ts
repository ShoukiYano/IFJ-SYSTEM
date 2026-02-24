import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

export const prismaMock = mockDeep<PrismaClient>();

// 各テスト前にモックをリセット
beforeEach(() => {
  mockReset(prismaMock);
});
