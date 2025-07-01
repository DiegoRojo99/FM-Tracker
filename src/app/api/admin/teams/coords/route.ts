import { getAllTeams } from "@/lib/db/teams";
import { GroupedTeamsByLeague } from "@/lib/types/Team";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  let teams = await getAllTeams();
  const { searchParams } = new URL(req.url);

  if (searchParams.get("coords")) {
    const hasCoords = searchParams.get("coords") === "true";
    teams = hasCoords ?
     teams.filter((team) => team.coordinates.lat && team.coordinates.lng) : 
     teams.filter((team) => !team.coordinates.lat || !team.coordinates.lng);
  }

  const groupedTeams: GroupedTeamsByLeague[] = [];
  for (const team of teams) {
    let group = groupedTeams.find((g) => g.leagueId === team.leagueId);
    if (!group) {
      group = { leagueId: team.leagueId, teams: [] };
      groupedTeams.push(group);
    }
    group.teams.push(team);
  }

  return new Response(JSON.stringify(groupedTeams), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}