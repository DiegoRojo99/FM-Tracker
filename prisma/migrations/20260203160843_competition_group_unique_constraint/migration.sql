/*
  Warnings:

  - A unique constraint covering the columns `[name,countryCode]` on the table `CompetitionGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CompetitionGroup_name_countryCode_key" ON "CompetitionGroup"("name", "countryCode");
