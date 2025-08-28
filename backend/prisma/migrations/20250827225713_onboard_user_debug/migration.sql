/*
  Warnings:

  - You are about to drop the column `sessionId` on the `OnboardingFlow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."OnboardingFlow" DROP COLUMN "sessionId";
