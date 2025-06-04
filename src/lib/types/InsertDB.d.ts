export type CountryInput = {
  name: string
  code: string // ISO Alpha-2, e.g. "IT", "ENG"
  flag: string
}

export type CompetitionInput = {
  name: string
  logoUrl: string
  countryCode: string
  type: 'league' | 'cup' | 'supercup'
}

export type TeamInput = {
  name: string
  logoUrl: string
  countryCode: string
  location: { lat: number; lng: number }
  competitionId: string
}

export type GameInput = {
  name: string
  startSeason: string
  releaseDate: Date
  coverUrl: string
}