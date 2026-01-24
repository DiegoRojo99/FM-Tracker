'use client';

import SearchDropdown from "@/app/components/algolia/TeamSearchDropdown";
import { Team } from "@/lib/types/firebase/Team";
import { useEffect, useState } from "react";
import TeamLocationPicker from "./TeamLocationPicker";
import Image from "next/image";
import BlurredCard from "@/app/components/BlurredCard";

function TeamCordsPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTeamCoordinates() {
      if (team && loading) {
        const response = await fetch(`/api/teams/${team.id}`);
        const data = await response.json();
        setTeam(data);
        setLoading(false);
      }
    }

    fetchTeamCoordinates();
  }, [team, loading]);

  return (
    <div className="flex flex-col items-center min-h-screen max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold my-8">Team Coordinates</h1>

      {/* Team Selection */}
      <div className="w-full mb-4">
        <label className="text-2xl font-bold mb-4"> Team </label>
        <SearchDropdown onTeamSelect={setTeam} />
      </div>

      {/* Map Section */}
      <div className="mt-4 w-full">
        {team ? (
          <TeamCordsMapSection team={team} loading={loading} setLoading={setLoading} />
        ) : (
          <p className="text-lg">No team selected</p>
        )}
      </div>
    </div>
  );
}

function TeamCordsMapSection({ team, loading, setLoading }: { team: Team; loading: boolean; setLoading: (loading: boolean) => void; }) {
  function addCoordinates(coords: [number, number]) {
    if (!team) {
      alert("Please select a team first.");
      return;
    }

    fetch(`/api/teams/${team.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates: { lat: coords[1], lng: coords[0] } }),
    });
    alert(`Coordinates added for team ${team.name}: ${coords[1]}, ${coords[0]}`);
    setLoading(true);
  }

  if (loading) {
    return <p className="text-lg">Loading...</p>;
  }
  else if (!team.coordinates.lat || !team.coordinates.lng) {
    return <TeamLocationPicker onSelect={(coords) => { if (team) addCoordinates(coords); }} />;
  }
  else {
    return (
      <BlurredCard>
        <div className="flex flex-col items-center justify-center p-4">
          <Image
            src={team.logo}
            alt={`${team.name} logo`}
            width={100}
          height={100}
          className="rounded-full mb-4"
        />
        <p className="text-lg">{team.name}</p>
        <p className="text-lg">
          Latitude: {team.coordinates.lat}, Longitude: {team.coordinates.lng}
        </p>
      </div>
      </BlurredCard>
    );
  }
}

export default TeamCordsPage;
