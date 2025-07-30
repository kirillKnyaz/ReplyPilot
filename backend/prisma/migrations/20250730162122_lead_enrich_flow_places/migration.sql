-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "placesId" TEXT,
ALTER COLUMN "mapsUri" DROP NOT NULL;
