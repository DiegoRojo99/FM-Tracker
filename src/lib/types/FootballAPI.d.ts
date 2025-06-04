export type ApiLeagueSeason = {
  year: number;
  start: string;
  end: string;
  current: boolean;
};

export type APICountry = {
  name: string;
  code: string | null;
  flag: string | null;
}

export type ApiLeague = {
  league: {
    id: number;
    name: string;
    type: 'League' | 'Cup' | 'Super Cup';
    logo: string;
  };
  country: APICountry;
  seasons: ApiLeagueSeason[];
};
