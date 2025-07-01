import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Team } from "../types/Team";
import { db } from "./firebase";

export async function fetchTeam(teamId: string) {
  const teamRef = doc(db, `teams/${teamId}`);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    return null;
  }

  const teamData = teamSnap.data() as Team;
  return teamData;
}

export async function getTeamsByIds(ids: string[]) {
  const teams = await Promise.all(ids.map(id => fetchTeam(id)));
  return teams.filter(Boolean) as Team[];
}

export async function getAllTeams() {
  const teamsRef = collection(db, "teams");
  const snapshot = await getDocs(teamsRef);
  const teams: Team[] = [];

  snapshot.forEach(doc => {
    const teamData = doc.data() as Team;
    teams.push(teamData);
  });

  return teams;
}