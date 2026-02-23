-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "closingDay" INTEGER DEFAULT 31,
ADD COLUMN     "paymentDay" INTEGER DEFAULT 31,
ADD COLUMN     "paymentMonthOffset" INTEGER DEFAULT 1;
