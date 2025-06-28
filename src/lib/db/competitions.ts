import { doc, getDoc } from "firebase/firestore";
import { Competition } from "../types/Country&Competition";
import { db } from "./firebase";

export async function fetchCompetition(countryCode: string, competitionId: string) {
  const competitionRef = doc(db, `countries/${countryCode}/competitions/${competitionId}`);
  const competitionSnap = await getDoc(competitionRef);

  if (!competitionSnap.exists()) {
    return null;
  }

  const competitionData = competitionSnap.data() as Competition;
  return competitionData;
}