-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'HIDDEN', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ChallengeGoalLogic" AS ENUM ('ALL', 'ANY');

-- CreateEnum
CREATE TYPE "ChallengeRunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- DropForeignKey
ALTER TABLE "CareerChallenge" DROP CONSTRAINT "CareerChallenge_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "CareerChallenge" DROP CONSTRAINT "CareerChallenge_gameId_fkey";

-- DropForeignKey
ALTER TABLE "CareerChallenge" DROP CONSTRAINT "CareerChallenge_saveId_fkey";

-- DropForeignKey
ALTER TABLE "CareerChallenge" DROP CONSTRAINT "CareerChallenge_userId_fkey";

-- DropForeignKey
ALTER TABLE "CareerChallengeGoal" DROP CONSTRAINT "CareerChallengeGoal_careerChallengeId_fkey";

-- DropForeignKey
ALTER TABLE "CareerChallengeGoal" DROP CONSTRAINT "CareerChallengeGoal_challengeGoalId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeGoal" DROP CONSTRAINT "ChallengeGoal_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeGoal" DROP CONSTRAINT "ChallengeGoal_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeGoal" DROP CONSTRAINT "ChallengeGoal_countryId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeGoalTeam" DROP CONSTRAINT "ChallengeGoalTeam_challengeGoalId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeGoalTeam" DROP CONSTRAINT "ChallengeGoalTeam_teamId_fkey";

-- DropTable
DROP TABLE "CareerChallenge";

-- DropTable
DROP TABLE "CareerChallengeGoal";

-- DropTable
DROP TABLE "Challenge";

-- DropTable
DROP TABLE "ChallengeGoal";

-- DropTable
DROP TABLE "ChallengeGoalTeam";

-- CreateTable
CREATE TABLE "ChallengeDefinition" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'HIDDEN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeDefinitionGoal" (
    "id" SERIAL NOT NULL,
    "challengeDefinitionId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "logic" "ChallengeGoalLogic" NOT NULL DEFAULT 'ALL',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeDefinitionGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeRule" (
    "id" SERIAL NOT NULL,
    "challengeGoalId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "subjectType" TEXT,
    "operator" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeRun" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "challengeDefinitionId" INTEGER NOT NULL,
    "status" "ChallengeRunStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progressSnapshot" JSONB,
    "metadata" JSONB,

    CONSTRAINT "ChallengeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeRunGoal" (
    "id" SERIAL NOT NULL,
    "challengeRunId" INTEGER NOT NULL,
    "challengeGoalId" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeRunGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDefinition_key_key" ON "ChallengeDefinition"("key");

-- CreateIndex
CREATE INDEX "ChallengeDefinition_status_idx" ON "ChallengeDefinition"("status");

-- CreateIndex
CREATE INDEX "ChallengeDefinition_sortOrder_idx" ON "ChallengeDefinition"("sortOrder");

-- CreateIndex
CREATE INDEX "ChallengeDefinition_key_idx" ON "ChallengeDefinition"("key");

-- CreateIndex
CREATE INDEX "ChallengeDefinitionGoal_challengeDefinitionId_idx" ON "ChallengeDefinitionGoal"("challengeDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDefinitionGoal_challengeDefinitionId_position_key" ON "ChallengeDefinitionGoal"("challengeDefinitionId", "position");

-- CreateIndex
CREATE INDEX "ChallengeRule_challengeGoalId_idx" ON "ChallengeRule"("challengeGoalId");

-- CreateIndex
CREATE INDEX "ChallengeRule_kind_idx" ON "ChallengeRule"("kind");

-- CreateIndex
CREATE INDEX "ChallengeRule_subjectType_idx" ON "ChallengeRule"("subjectType");

-- CreateIndex
CREATE INDEX "ChallengeRun_userId_idx" ON "ChallengeRun"("userId");

-- CreateIndex
CREATE INDEX "ChallengeRun_challengeDefinitionId_idx" ON "ChallengeRun"("challengeDefinitionId");

-- CreateIndex
CREATE INDEX "ChallengeRun_saveId_idx" ON "ChallengeRun"("saveId");

-- CreateIndex
CREATE INDEX "ChallengeRun_gameId_idx" ON "ChallengeRun"("gameId");

-- CreateIndex
CREATE INDEX "ChallengeRun_status_idx" ON "ChallengeRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeRun_userId_challengeDefinitionId_saveId_key" ON "ChallengeRun"("userId", "challengeDefinitionId", "saveId");

-- CreateIndex
CREATE INDEX "ChallengeRunGoal_challengeRunId_idx" ON "ChallengeRunGoal"("challengeRunId");

-- CreateIndex
CREATE INDEX "ChallengeRunGoal_challengeGoalId_idx" ON "ChallengeRunGoal"("challengeGoalId");

-- CreateIndex
CREATE INDEX "ChallengeRunGoal_isComplete_idx" ON "ChallengeRunGoal"("isComplete");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeRunGoal_challengeRunId_challengeGoalId_key" ON "ChallengeRunGoal"("challengeRunId", "challengeGoalId");

-- AddForeignKey
ALTER TABLE "ChallengeDefinitionGoal" ADD CONSTRAINT "ChallengeDefinitionGoal_challengeDefinitionId_fkey" FOREIGN KEY ("challengeDefinitionId") REFERENCES "ChallengeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRule" ADD CONSTRAINT "ChallengeRule_challengeGoalId_fkey" FOREIGN KEY ("challengeGoalId") REFERENCES "ChallengeDefinitionGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRun" ADD CONSTRAINT "ChallengeRun_challengeDefinitionId_fkey" FOREIGN KEY ("challengeDefinitionId") REFERENCES "ChallengeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRun" ADD CONSTRAINT "ChallengeRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRun" ADD CONSTRAINT "ChallengeRun_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "Save"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRun" ADD CONSTRAINT "ChallengeRun_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRunGoal" ADD CONSTRAINT "ChallengeRunGoal_challengeRunId_fkey" FOREIGN KEY ("challengeRunId") REFERENCES "ChallengeRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRunGoal" ADD CONSTRAINT "ChallengeRunGoal_challengeGoalId_fkey" FOREIGN KEY ("challengeGoalId") REFERENCES "ChallengeDefinitionGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
