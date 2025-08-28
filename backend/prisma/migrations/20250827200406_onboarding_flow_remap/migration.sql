-- CreateEnum
CREATE TYPE "public"."RiskTolerance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."TonePreference" AS ENUM ('CASUAL', 'PROFESSIONAL', 'BOLD', 'CAREFUL');

-- AlterTable
ALTER TABLE "public"."UserProfile" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "hoursPerWeek" INTEGER,
ADD COLUMN     "keywords" JSONB,
ADD COLUMN     "obstacles" JSONB,
ADD COLUMN     "riskTolerance" "public"."RiskTolerance",
ADD COLUMN     "successKpi" TEXT,
ADD COLUMN     "tonePreference" "public"."TonePreference",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "urgency" INTEGER;

-- CreateTable
CREATE TABLE "public"."OnboardingFlow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingFlow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."OnboardingFlow" ADD CONSTRAINT "OnboardingFlow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
