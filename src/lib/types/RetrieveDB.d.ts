import { CareerStint } from "./InsertDB"

export type Country = CountryInput & {
  id: string
}

export type Competition = CompetitionInput & {
  id: string
  country?: Country
}

export type Team = TeamInput & {
  id: string
  competition?: Competition
  country?: Country
}

export type Game = GameInput & {
  id: string
}

export type League = LeagueInput & {
  id: string
  country?: Country
  teams?: Team[]
}

export type Save = {
  id: string;
  userId: string;
  createdAt: Timestamp;
  countryCode: string;
  leagueId: number;
  startingTeamId: number;
  career?: CareerStint[];
}
