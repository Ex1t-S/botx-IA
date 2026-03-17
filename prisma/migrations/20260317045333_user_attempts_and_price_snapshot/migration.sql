-- AlterTable
ALTER TABLE "FoundWallet" ADD COLUMN     "priceSnapshotUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "scanAttempts" INTEGER NOT NULL DEFAULT 0;
