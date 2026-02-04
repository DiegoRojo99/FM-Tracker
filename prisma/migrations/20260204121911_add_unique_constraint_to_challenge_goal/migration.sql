/*
  Warnings:

  - A unique constraint covering the columns `[description,challengeId]` on the table `ChallengeGoal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChallengeGoal_description_challengeId_key" ON "ChallengeGoal"("description", "challengeId");
