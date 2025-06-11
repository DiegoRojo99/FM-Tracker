'use client';
import { CareerStint } from "@/lib/types/InsertDB";
import { TeamWithLogo } from "@/lib/types/RetrieveDB";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface CareerStintProps {
  careerStint: CareerStint;
  teamData?: Record<string, TeamWithLogo>;
}

async function fetchTeamById(id: string): Promise<TeamWithLogo | null> {
  return fetch(`/api/teams/${id}`).then(res => res.json());
}

const CareerStintUI: React.FC<CareerStintProps> = ({ careerStint, teamData }) => {
  const [team, setTeam] = useState<TeamWithLogo | null>(null);

  useEffect(() => {
    if (teamData) {
      setTeam(teamData);
    } 
    else {
      fetchTeamById(careerStint.teamId).then(setTeam);
    }
  }, [careerStint.teamId, teamData]);

  if (!team) return <></>;
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border shadow transition-all border-purple-600 bg-purple-50 dark:bg-purple-900">
      {team.logo && ( <Image src={team.logo} alt={team.name} width={128} height={128} className="w-md-32 w-16 h-auto" /> )}
      <div>
        <div><strong>{team.name}</strong></div>
        <div>
          {careerStint.startDate} – {careerStint.endDate ?? 'present'}
        </div>
      </div>
    </div>
  );
};

export default CareerStintUI;