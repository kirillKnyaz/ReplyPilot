-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "current_period_end" INTEGER;
