/*
  Warnings:

  - You are about to drop the column `icp` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `niche` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "icp",
DROP COLUMN "niche",
DROP COLUMN "tone",
ADD COLUMN     "icpSummary" TEXT,
ADD COLUMN     "profileData" JSONB;
