-- AlterTable
ALTER TABLE "Player" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'available';
ALTER TABLE "Player" ADD COLUMN "nickname" TEXT;
ALTER TABLE "Player" ADD COLUMN "preferredFoot" TEXT;
ALTER TABLE "Player" ADD COLUMN "joinedAt" TIMESTAMP(3);
ALTER TABLE "Player" ADD COLUMN "injuryType" TEXT;
ALTER TABLE "Player" ADD COLUMN "injuryZone" TEXT;
ALTER TABLE "Player" ADD COLUMN "injuryReturnDate" TIMESTAMP(3);
