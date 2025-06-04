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
}

export type GameInput = {
  name: string
  startSeason: string
  releaseDate: Date
  coverUrl: string
}