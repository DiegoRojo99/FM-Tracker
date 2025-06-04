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

export type ApiTeam = {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number | null;
    name: string | null;
    address: string | null;
    city: string | null;
    capacity: number | null;
    surface: string | null;
    image: string | null;
    lat?: number | null;
    lng?: number | null;
  };
};
