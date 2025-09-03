-- AlterTable
ALTER TABLE "public"."UserProfile" ADD COLUMN     "audienceComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "businessComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offerComplete" BOOLEAN NOT NULL DEFAULT false;
