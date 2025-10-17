/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNumber]` on the table `order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "order" ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "order_invoiceNumber_key" ON "order"("invoiceNumber");
