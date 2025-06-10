'use client';
import { CareerStint } from "@/lib/types/InsertDB";
import { TeamWithLogo } from "@/lib/types/RetrieveDB";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface CareerStintProps {
  careerStint: CareerStint;
}

async function fetchTeamById(id: string): Promise<TeamWithLogo | null> {
  return fetch(`/api/teams/${id}`).then(res => res.json());
}

const CareerStintUI: React.FC<CareerStintProps> = ({ careerStint }) => {
  const [team, setTeam] = useState<TeamWithLogo | null>(null);

  useEffect(() => {
    fetchTeamById(careerStint.teamId).then(setTeam);
  }, [careerStint.teamId]);

  if (!team) return <div>Loading...</div>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {team.logo && ( <Image src={team.logo} alt={team.name} width={128} height={128} /> )}
      <div>
        <div><strong>{team.name}</strong></div>
        <div>
          {careerStint.startDate} to {careerStint.endDate ?? 'present'}
        </div>
      </div>
    </div>
  );
};

export default CareerStintUI;