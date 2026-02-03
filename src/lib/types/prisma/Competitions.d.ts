import { CompetitionGroup, Country, ApiCompetition } from "../../../../prisma/generated/client";

export type CountryWithCompetitions = Country & {
  competitions: CompetitionGroup[];
};

export type {
  CompetitionGroup,
  Country,
  CountryWithCompetitions,
  ApiCompetition
}