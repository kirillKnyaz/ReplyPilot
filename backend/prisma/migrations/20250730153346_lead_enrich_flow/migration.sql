/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "createdAt",
DROP COLUMN "notes",
DROP COLUMN "score",
ADD COLUMN     "contactComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "identityComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "socialComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "website" DROP NOT NULL;
