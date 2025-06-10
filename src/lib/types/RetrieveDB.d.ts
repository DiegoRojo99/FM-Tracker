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

export type TeamWithLogo = TeamInput & {
  id: string
  logo: string
}

export type Game = GameInput & {
  id: string
}

export type League = LeagueInput & {
  id: string
  country?: Country
  teams?: Team[]
}