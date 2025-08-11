-- CreateEnum
CREATE TYPE "public"."SearchType" AS ENUM ('NEARBY', 'TEXT');

-- CreateTable
CREATE TABLE "public"."SearchResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."SearchType" NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL,
    "category" TEXT,
    "textQuery" TEXT,
    "maxResultCount" INTEGER NOT NULL,
    "placesCount" INTEGER NOT NULL,
    "tokensCharged" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchResult_userId_createdAt_idx" ON "public"."SearchResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchResult_type_createdAt_idx" ON "public"."SearchResult"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."SearchResult" ADD CONSTRAINT "SearchResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
