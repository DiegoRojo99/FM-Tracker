/*
  Warnings:

  - A unique constraint covering the columns `[name,countryCode]` on the table `ApiCompetition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Country` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Country` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seasonId,competitionId]` on the table `CupResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,version,platform]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fromGroupId,toGroupId,type]` on the table `PromotionRelegation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saveId,teamId,season]` on the table `Season` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,countryCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[competitionGroupId,season,saveId]` on the table `Trophy` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApiCompetition_name_countryCode_key" ON "ApiCompetition"("name", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CupResult_seasonId_competitionId_key" ON "CupResult"("seasonId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_version_platform_key" ON "Game"("name", "version", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRelegation_fromGroupId_toGroupId_type_key" ON "PromotionRelegation"("fromGroupId", "toGroupId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Season_saveId_teamId_season_key" ON "Season"("saveId", "teamId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_countryCode_key" ON "Team"("name", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Trophy_competitionGroupId_season_saveId_key" ON "Trophy"("competitionGroupId", "season", "saveId");
