/*
  Warnings:

  - Added the required column `status` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Made the column `current_period_end` on table `Subscription` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "active" DROP DEFAULT,
ALTER COLUMN "current_period_end" SET NOT NULL;
