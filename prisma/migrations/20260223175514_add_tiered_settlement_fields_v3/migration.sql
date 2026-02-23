-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "deductionAmount2" DECIMAL(12,2),
ADD COLUMN     "deductionRate2" DECIMAL(12,2),
ADD COLUMN     "maxHours2" DOUBLE PRECISION,
ADD COLUMN     "minHours2" DOUBLE PRECISION,
ADD COLUMN     "overtimeAmount2" DECIMAL(12,2),
ADD COLUMN     "overtimeRate2" DECIMAL(12,2);
