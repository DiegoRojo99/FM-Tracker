export type SaveInput = {
  userId: string;
  countryCode: string;
  leagueId: number;
  startingTeamId: number;
}

export type Save = SaveInput & {
  id: string;
  createdAt: Timestamp;
}

export type SaveWithCareer = SaveInput & {
  id: string;
  createdAt: Timestamp;
  career?: CareerStint[];
}
  
export type SaveWithDetails = SaveInput & {
  id: string;
  createdAt: Timestamp;
  team?: Team;
  league?: League;
}
