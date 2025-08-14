-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('CERTAIN', 'HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM';
