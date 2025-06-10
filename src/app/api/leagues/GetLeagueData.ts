import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GetLeagueData(leagueId: string) {
  const leagueRef = doc(db, 'competitions', leagueId);
  const leagueSnap = await getDoc(leagueRef);
  const league = leagueSnap.exists() ? { id: leagueSnap.id, ...leagueSnap.data() } : null;
  return league;
}