'use client';

import { GroupedTeamsByLeagueWithCoords, Team } from "@/lib/types/Team";
import { useEffect, useState } from "react";

function TeamCordsPage() {
  const [groupedTeams, setGroupedTeams] = useState<GroupedTeamsByLeagueWithCoords[] | null>(null);

  useEffect(() => {
    async function fetchTeamsWithCoordinates() {
      const response = await fetch(`/api/admin/teams/coords`);
      const data = await response.json();
      setGroupedTeams(data);
    }

    fetchTeamsWithCoordinates();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold my-8">Team Coordinates</h1>

      {/* Teams Section */}
      <div className="mt-4 w-full flex flex-col gap-4">
        {groupedTeams && groupedTeams.sort((a, b) => b.teamsWithCoords - a.teamsWithCoords).map((group) => (
          <LeagueCard key={group.leagueId} group={group} />
        ))}
      </div>
    </div>
  );
}

function LeagueCard({ group }: { group: GroupedTeamsByLeagueWithCoords }) {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-2">League ID: {group.leagueId}</h2>
      <p className="text-sm text-gray-600 mb-4">Total Teams: {group.teams.length}</p>
      <p className="text-sm text-gray-600 mb-4">Teams with Coordinates: {group.teamsWithCoords}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {group.teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h2 className="text-md text-center font-bold">{team.name}</h2>
      {team.coordinates.lat && team.coordinates.lng && (
        <div className="mt-2 flex flex-col">
          <p className="text-center text-xs">{team.coordinates.lat.toFixed(4)}, {team.coordinates.lng.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}

export default TeamCordsPage;
