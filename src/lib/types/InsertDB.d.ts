import { Timestamp } from "firebase-admin/firestore"

export type CountryInput = {
  name: string
  code: string
  flag: string
}

export type CompetitionInput = {
  name: string
  logoUrl: string
  countryCode: string
  type: 'League' | 'Cup' | 'Super Cup'
}

export type TeamInput = {
  name: string
  logoUrl: string
  countryCode: string
  location: { lat: number; lng: number }
  competitionId: string
  national: boolean
}

export type GameInput = {
  name: string
  startSeason: string
  releaseDate: Date
  coverUrl: string
}

export type LeagueInput = {
  name: string
  logoUrl: string
  countryCode: string
}

export type CareerStintInput = {
  teamId: string;
  teamLogo: string;          // Optional, for convenience
  teamName: string;          // Optional, for convenience
  startDate: string;            // ISO date, e.g. "2025-07-01"
  endDate: string | null;       // Null if ongoing
  isNational: boolean;
  countryCode: string;          // For convenience/lookup
  leagueId: string;            // League where club competes (optional)
  createdAt: Timestamp;       // Timestamp of creation
}