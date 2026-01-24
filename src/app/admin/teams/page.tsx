'use client';

import { SaveTeam } from "@/lib/types/firebase/Save";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<SaveTeam[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch("/api/admin/teams");
      const data = await response.json();
      console.log("Fetched teams:", data);
      setTeams(data);
    };
    fetchTeams();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">User Teams</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="flex flex-col items-center p-4 rounded-lg shadow bg-purple-500">
            <Image
              src={team.logo}
              alt={`${team.name} logo`}
              width={100}
              height={100}
              className="mb-2 flex-1 object-contain"
            />
            <h2 className="text-l font-semibold h-fit pt-2">{team.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}