/*
  Warnings:

  - A unique constraint covering the columns `[inventoryId]` on the table `License` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "License" ADD COLUMN     "inventoryId" TEXT;

-- CreateTable
CREATE TABLE "LicenseInventory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priceUsd" INTEGER NOT NULL,
    "keysPerMinute" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "rank" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "assignedToUserId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseInventory_code_key" ON "LicenseInventory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "License_inventoryId_key" ON "License"("inventoryId");

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "LicenseInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
