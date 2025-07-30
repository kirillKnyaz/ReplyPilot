-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('WEBSITE', 'SOCIAL');

-- CreateEnum
CREATE TYPE "SourceGoal" AS ENUM ('IDENTITY', 'CONTACT', 'SOCIAL');

-- CreateTable
CREATE TABLE "LeadSource" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "goal" "SourceGoal" NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeadSource" ADD CONSTRAINT "LeadSource_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
