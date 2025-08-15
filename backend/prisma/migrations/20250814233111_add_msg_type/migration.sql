/*
  Warnings:

  - Changed the type of `method` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('EMAIL', 'SOCIAL', 'SMS', 'PHONE');

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "method",
ADD COLUMN     "method" "public"."MessageType" NOT NULL;
