export type FirebaseCountry = {
  code: string;              // e.g., "DE"
  name: string;              // e.g., "Germany"
  flag: string;              // URL to flag image
  inFootballManager: boolean;
};

export type FirebaseCompetition = {
  id: number;                // API-sports ID
  name: string;              // e.g., "Super Cup"
  logo: string;              // URL to competition logo
  type: 'League' | 'Cup' | string; // Optional enum, fallback to string for flexibility
  season: number;            // e.g., 2023
  countryCode: string;       // e.g., "DE"
  countryName: string;       // e.g., "Germany"
  inFootballManager: boolean; // Indicates if the competition is in Football Manager
  isFemale?: boolean;         // Indicates if the competition is a female league (optional)
};

export type FirebaseCountryWithCompetitions = FirebaseCountry & {
  competitions?: FirebaseCompetition[];
};
