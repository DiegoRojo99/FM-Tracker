/*
  Warnings:

  - A unique constraint covering the columns `[userId,challengeId,saveId]` on the table `CareerChallenge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CareerChallenge_userId_challengeId_saveId_key" ON "CareerChallenge"("userId", "challengeId", "saveId");
