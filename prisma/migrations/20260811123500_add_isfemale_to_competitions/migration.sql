-- Add explicit gender metadata to competitions.
ALTER TABLE "ApiCompetition"
ADD COLUMN "isFemale" BOOLEAN;

ALTER TABLE "CompetitionGroup"
ADD COLUMN "isFemale" BOOLEAN;

-- Indexes for gender-aware filtering in API/dropdown queries.
CREATE INDEX "ApiCompetition_isFemale_idx" ON "ApiCompetition"("isFemale");
CREATE INDEX "CompetitionGroup_isFemale_idx" ON "CompetitionGroup"("isFemale");
