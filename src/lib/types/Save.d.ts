import { CareerChallenge } from "./Challenge";
import { CareerStint } from "./InsertDB";
import { SeasonSummary } from "./Season";
import { Trophy } from "./Trophy";

export type SaveInput = {
  userId: string;
  countryCode: string;
  leagueId: number;
  startingTeamId: number;
}

export type SaveTeam = {
  id: number;
  name: string;
  logo: string;
}

export type SaveLeague = {
  id: number;
  name: string;
  logo: string;
}

export type Save = {
  id: string;
  userId: string;
  countryCode: string;
  leagueId: number;
  currentClub: SaveTeam | null;
  currentNT: SaveTeam | null;
  currentLeague?: SaveLeague;
  season: string; // e.g., "2026/27"
  createdAt: Timestamp;
}

export type SaveWithCareer = SaveInput & {
  id: string;
  createdAt: Timestamp;
  career: CareerStint[];
}

export type SaveWithChildren = Save & {
  career?: CareerStint[];
  trophies?: Trophy[];
  seasons?: SeasonSummary[];
  challenges?: CareerChallenge[];
}