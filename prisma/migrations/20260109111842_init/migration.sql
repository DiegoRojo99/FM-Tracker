-- CreateTable
CREATE TABLE "User" (
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarURL" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Save" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "countryCode" TEXT,
    "currentClubId" INTEGER,
    "currentNTId" INTEGER,
    "currentLeagueId" INTEGER,
    "season" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerStint" (
    "id" SERIAL NOT NULL,
    "saveId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "isNational" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerStint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "saveId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CupResult" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "reachedRound" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CupResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueResult" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "promoted" BOOLEAN NOT NULL,
    "relegated" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "competitionGroupId" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saveId" TEXT,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bonus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeGoal" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "competitionId" INTEGER,
    "countryId" TEXT,
    "challengeId" INTEGER NOT NULL,

    CONSTRAINT "ChallengeGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeGoalTeam" (
    "id" SERIAL NOT NULL,
    "challengeGoalId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "ChallengeGoalTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerChallenge" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "gameId" INTEGER NOT NULL,
    "saveId" TEXT,

    CONSTRAINT "CareerChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerChallengeGoal" (
    "id" SERIAL NOT NULL,
    "careerChallengeId" INTEGER NOT NULL,
    "challengeGoalId" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerChallengeGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeason" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "apiCompetitionId" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "variant" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "national" BOOLEAN NOT NULL,
    "countryCode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isFemale" BOOLEAN,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "inFootballManager" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ApiCompetition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "logoUrl" TEXT,
    "tier" INTEGER,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tier" INTEGER,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionGroupApiCompetition" (
    "id" SERIAL NOT NULL,
    "competitionGroupId" INTEGER NOT NULL,
    "apiCompetitionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionGroupApiCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRelegation" (
    "id" SERIAL NOT NULL,
    "fromGroupId" INTEGER NOT NULL,
    "toGroupId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "slots" INTEGER NOT NULL,
    "playoffSlots" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRelegation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Save_userId_idx" ON "Save"("userId");

-- CreateIndex
CREATE INDEX "Save_gameId_idx" ON "Save"("gameId");

-- CreateIndex
CREATE INDEX "Save_season_idx" ON "Save"("season");

-- CreateIndex
CREATE INDEX "Save_createdAt_idx" ON "Save"("createdAt");

-- CreateIndex
CREATE INDEX "CareerStint_saveId_idx" ON "CareerStint"("saveId");

-- CreateIndex
CREATE INDEX "CareerStint_teamId_idx" ON "CareerStint"("teamId");

-- CreateIndex
CREATE INDEX "CareerStint_startDate_idx" ON "CareerStint"("startDate");

-- CreateIndex
CREATE INDEX "Season_saveId_idx" ON "Season"("saveId");

-- CreateIndex
CREATE INDEX "Season_teamId_idx" ON "Season"("teamId");

-- CreateIndex
CREATE INDEX "Season_season_idx" ON "Season"("season");

-- CreateIndex
CREATE INDEX "CupResult_seasonId_idx" ON "CupResult"("seasonId");

-- CreateIndex
CREATE INDEX "CupResult_competitionId_idx" ON "CupResult"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueResult_seasonId_key" ON "LeagueResult"("seasonId");

-- CreateIndex
CREATE INDEX "LeagueResult_competitionId_idx" ON "LeagueResult"("competitionId");

-- CreateIndex
CREATE INDEX "LeagueResult_position_idx" ON "LeagueResult"("position");

-- CreateIndex
CREATE INDEX "Trophy_teamId_idx" ON "Trophy"("teamId");

-- CreateIndex
CREATE INDEX "Trophy_competitionGroupId_idx" ON "Trophy"("competitionGroupId");

-- CreateIndex
CREATE INDEX "Trophy_gameId_idx" ON "Trophy"("gameId");

-- CreateIndex
CREATE INDEX "Trophy_saveId_idx" ON "Trophy"("saveId");

-- CreateIndex
CREATE INDEX "Trophy_season_idx" ON "Trophy"("season");

-- CreateIndex
CREATE INDEX "Challenge_name_idx" ON "Challenge"("name");

-- CreateIndex
CREATE INDEX "ChallengeGoal_challengeId_idx" ON "ChallengeGoal"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeGoal_competitionId_idx" ON "ChallengeGoal"("competitionId");

-- CreateIndex
CREATE INDEX "ChallengeGoal_countryId_idx" ON "ChallengeGoal"("countryId");

-- CreateIndex
CREATE INDEX "ChallengeGoalTeam_challengeGoalId_idx" ON "ChallengeGoalTeam"("challengeGoalId");

-- CreateIndex
CREATE INDEX "ChallengeGoalTeam_teamId_idx" ON "ChallengeGoalTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeGoalTeam_challengeGoalId_teamId_key" ON "ChallengeGoalTeam"("challengeGoalId", "teamId");

-- CreateIndex
CREATE INDEX "CareerChallenge_userId_idx" ON "CareerChallenge"("userId");

-- CreateIndex
CREATE INDEX "CareerChallenge_challengeId_idx" ON "CareerChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "CareerChallenge_gameId_idx" ON "CareerChallenge"("gameId");

-- CreateIndex
CREATE INDEX "CareerChallenge_saveId_idx" ON "CareerChallenge"("saveId");

-- CreateIndex
CREATE INDEX "CareerChallengeGoal_careerChallengeId_idx" ON "CareerChallengeGoal"("careerChallengeId");

-- CreateIndex
CREATE INDEX "CareerChallengeGoal_challengeGoalId_idx" ON "CareerChallengeGoal"("challengeGoalId");

-- CreateIndex
CREATE INDEX "CareerChallengeGoal_isComplete_idx" ON "CareerChallengeGoal"("isComplete");

-- CreateIndex
CREATE UNIQUE INDEX "CareerChallengeGoal_careerChallengeId_challengeGoalId_key" ON "CareerChallengeGoal"("careerChallengeId", "challengeGoalId");

-- CreateIndex
CREATE INDEX "TeamSeason_teamId_idx" ON "TeamSeason"("teamId");

-- CreateIndex
CREATE INDEX "TeamSeason_apiCompetitionId_idx" ON "TeamSeason"("apiCompetitionId");

-- CreateIndex
CREATE INDEX "TeamSeason_season_idx" ON "TeamSeason"("season");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeason_teamId_apiCompetitionId_season_key" ON "TeamSeason"("teamId", "apiCompetitionId", "season");

-- CreateIndex
CREATE INDEX "Game_isActive_idx" ON "Game"("isActive");

-- CreateIndex
CREATE INDEX "Game_sortOrder_idx" ON "Game"("sortOrder");

-- CreateIndex
CREATE INDEX "Game_releaseDate_idx" ON "Game"("releaseDate");

-- CreateIndex
CREATE INDEX "Country_name_idx" ON "Country"("name");

-- CreateIndex
CREATE INDEX "Country_inFootballManager_idx" ON "Country"("inFootballManager");

-- CreateIndex
CREATE INDEX "ApiCompetition_countryCode_idx" ON "ApiCompetition"("countryCode");

-- CreateIndex
CREATE INDEX "ApiCompetition_type_idx" ON "ApiCompetition"("type");

-- CreateIndex
CREATE INDEX "ApiCompetition_tier_idx" ON "ApiCompetition"("tier");

-- CreateIndex
CREATE INDEX "ApiCompetition_isActive_idx" ON "ApiCompetition"("isActive");

-- CreateIndex
CREATE INDEX "CompetitionGroup_countryCode_idx" ON "CompetitionGroup"("countryCode");

-- CreateIndex
CREATE INDEX "CompetitionGroup_type_idx" ON "CompetitionGroup"("type");

-- CreateIndex
CREATE INDEX "CompetitionGroup_tier_idx" ON "CompetitionGroup"("tier");

-- CreateIndex
CREATE INDEX "CompetitionGroup_isActive_idx" ON "CompetitionGroup"("isActive");

-- CreateIndex
CREATE INDEX "CompetitionGroup_name_idx" ON "CompetitionGroup"("name");

-- CreateIndex
CREATE INDEX "CompetitionGroupApiCompetition_competitionGroupId_idx" ON "CompetitionGroupApiCompetition"("competitionGroupId");

-- CreateIndex
CREATE INDEX "CompetitionGroupApiCompetition_apiCompetitionId_idx" ON "CompetitionGroupApiCompetition"("apiCompetitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionGroupApiCompetition_competitionGroupId_apiCompet_key" ON "CompetitionGroupApiCompetition"("competitionGroupId", "apiCompetitionId");

-- CreateIndex
CREATE INDEX "PromotionRelegation_fromGroupId_idx" ON "PromotionRelegation"("fromGroupId");

-- CreateIndex
CREATE INDEX "PromotionRelegation_toGroupId_idx" ON "PromotionRelegation"("toGroupId");

-- CreateIndex
CREATE INDEX "PromotionRelegation_type_idx" ON "PromotionRelegation"("type");

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_currentClubId_fkey" FOREIGN KEY ("currentClubId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_currentNTId_fkey" FOREIGN KEY ("currentNTId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_currentLeagueId_fkey" FOREIGN KEY ("currentLeagueId") REFERENCES "CompetitionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerStint" ADD CONSTRAINT "CareerStint_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "Save"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerStint" ADD CONSTRAINT "CareerStint_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "Save"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CupResult" ADD CONSTRAINT "CupResult_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CupResult" ADD CONSTRAINT "CupResult_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "CompetitionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueResult" ADD CONSTRAINT "LeagueResult_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueResult" ADD CONSTRAINT "LeagueResult_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "CompetitionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_competitionGroupId_fkey" FOREIGN KEY ("competitionGroupId") REFERENCES "CompetitionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "Save"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGoal" ADD CONSTRAINT "ChallengeGoal_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGoal" ADD CONSTRAINT "ChallengeGoal_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "CompetitionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGoal" ADD CONSTRAINT "ChallengeGoal_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGoalTeam" ADD CONSTRAINT "ChallengeGoalTeam_challengeGoalId_fkey" FOREIGN KEY ("challengeGoalId") REFERENCES "ChallengeGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGoalTeam" ADD CONSTRAINT "ChallengeGoalTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallenge" ADD CONSTRAINT "CareerChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallenge" ADD CONSTRAINT "CareerChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallenge" ADD CONSTRAINT "CareerChallenge_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallenge" ADD CONSTRAINT "CareerChallenge_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "Save"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallengeGoal" ADD CONSTRAINT "CareerChallengeGoal_careerChallengeId_fkey" FOREIGN KEY ("careerChallengeId") REFERENCES "CareerChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallengeGoal" ADD CONSTRAINT "CareerChallengeGoal_challengeGoalId_fkey" FOREIGN KEY ("challengeGoalId") REFERENCES "ChallengeGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeason" ADD CONSTRAINT "TeamSeason_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeason" ADD CONSTRAINT "TeamSeason_apiCompetitionId_fkey" FOREIGN KEY ("apiCompetitionId") REFERENCES "ApiCompetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiCompetition" ADD CONSTRAINT "ApiCompetition_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionGroup" ADD CONSTRAINT "CompetitionGroup_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionGroupApiCompetition" ADD CONSTRAINT "CompetitionGroupApiCompetition_competitionGroupId_fkey" FOREIGN KEY ("competitionGroupId") REFERENCES "CompetitionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionGroupApiCompetition" ADD CONSTRAINT "CompetitionGroupApiCompetition_apiCompetitionId_fkey" FOREIGN KEY ("apiCompetitionId") REFERENCES "ApiCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRelegation" ADD CONSTRAINT "PromotionRelegation_fromGroupId_fkey" FOREIGN KEY ("fromGroupId") REFERENCES "CompetitionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRelegation" ADD CONSTRAINT "PromotionRelegation_toGroupId_fkey" FOREIGN KEY ("toGroupId") REFERENCES "CompetitionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
