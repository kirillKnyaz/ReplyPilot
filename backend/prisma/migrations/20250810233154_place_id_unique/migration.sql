/*
  Warnings:

  - A unique constraint covering the columns `[placesId]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lead_placesId_key" ON "Lead"("placesId");
