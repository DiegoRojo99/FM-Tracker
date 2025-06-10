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

export type CareerStint = {
  id?: string;
  teamId: string;
  leagueId?: string;            // League where club competes (optional)
  countryCode: string;          // For convenience/lookup
  isNationalTeam: boolean;
  startDate: string;            // ISO date, e.g. "2025-07-01"
  endDate?: string;             // Null if ongoing
  seasons: string[];            // e.g. ["2024/25", "2025/26"]
  notes?: string;               // For things like 'got fired', 'won league'
};