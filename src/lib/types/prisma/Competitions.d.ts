import { CompetitionGroup, Country } from "../../../../prisma/generated/client";

export type CountryWithCompetitions = Country & {
  competitions: CompetitionGroup[];
};