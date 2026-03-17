/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `License` table. All the data in the column will be lost.
  - You are about to drop the `LicenseInventory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `License` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_inventoryId_fkey";

-- DropIndex
DROP INDEX "License_inventoryId_key";

-- AlterTable
ALTER TABLE "License" DROP COLUMN "inventoryId",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "keysPerMinute" SET DEFAULT 1200;

-- DropTable
DROP TABLE "LicenseInventory";

-- CreateIndex
CREATE UNIQUE INDEX "License_code_key" ON "License"("code");
