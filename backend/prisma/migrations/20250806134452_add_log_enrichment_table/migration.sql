-- CreateEnum
CREATE TYPE "EnrichmentStep" AS ENUM ('GET_LEAD', 'GET_SOURCE', 'SCRAPE_SOURCE', 'EVALUATE_GPT');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('STARTED', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "LeadEnrichmentLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" "SourceGoal" NOT NULL,
    "step" "EnrichmentStep" NOT NULL,
    "status" "EnrichmentStatus" NOT NULL,
    "message" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEnrichmentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeadEnrichmentLog" ADD CONSTRAINT "LeadEnrichmentLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
