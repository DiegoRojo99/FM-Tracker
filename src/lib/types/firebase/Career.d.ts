import admin from "firebase-admin";

type Timestamp = admin.firestore.Timestamp;

export type CareerStint = {
  id?: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  countryCode: string;
  leagueId: string;
  startDate: string;
  endDate: string | null;
  isNational: boolean;
  createdAt: Timestamp;
};