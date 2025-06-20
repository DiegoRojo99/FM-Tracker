import { Timestamp } from "firebase-admin/firestore";

export type CareerStint = {
  id?: string;
  teamId: string;
  countryCode: string;
  startDate: string;
  endDate: string | null;
  isNational: boolean;
  createdAt: Timestamp;
  teamLogo?: string; // Optional, for convenience
  teamName?: string; // Optional, for convenience
};