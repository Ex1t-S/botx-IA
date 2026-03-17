-- AlterTable
ALTER TABLE "FoundWallet" ALTER COLUMN "priceSnapshotUsd" DROP NOT NULL,
ALTER COLUMN "priceSnapshotUsd" DROP DEFAULT;

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "lastProcessedMilestone" INTEGER NOT NULL DEFAULT 0;
