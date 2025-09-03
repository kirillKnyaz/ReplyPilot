/*
  Warnings:

  - You are about to drop the column `confidence` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `hoursPerWeek` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `obstacles` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profileData` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `riskTolerance` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `successKpi` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tonePreference` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `urgency` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserProfile" DROP COLUMN "confidence",
DROP COLUMN "goal",
DROP COLUMN "hoursPerWeek",
DROP COLUMN "keywords",
DROP COLUMN "obstacles",
DROP COLUMN "profileData",
DROP COLUMN "riskTolerance",
DROP COLUMN "successKpi",
DROP COLUMN "tonePreference",
DROP COLUMN "urgency",
ADD COLUMN     "audienceAge" TEXT,
ADD COLUMN     "audienceDefinition" TEXT,
ADD COLUMN     "audienceLocation" TEXT,
ADD COLUMN     "audienceProblem" TEXT,
ADD COLUMN     "businessAdvantage" TEXT,
ADD COLUMN     "businessGoals" TEXT,
ADD COLUMN     "businessOffer" TEXT,
ADD COLUMN     "businessPurpose" TEXT,
ADD COLUMN     "offerExclusivity" TEXT,
ADD COLUMN     "offerMonetization" TEXT,
ADD COLUMN     "offerOptions" TEXT,
ADD COLUMN     "offerPricing" TEXT;
