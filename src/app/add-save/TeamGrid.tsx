'use client'

import { Team } from "@/lib/types/RetrieveDB";
import Image from "next/image";

type Props = {
  teams: Team[];
  selectedTeamId: string | null;
  onSelect: (id: string) => void;
};

export default function TeamGrid({ teams, selectedTeamId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
      {teams.map((team) => (
        <div
          key={team.id}
          onClick={() => onSelect(team.id.toString())}
          className={`rounded-2xl border p-4 cursor-pointer text-center shadow-sm hover:shadow-md transition-all duration-200
            ${selectedTeamId === team.id.toString() ? 'border-purple-600 bg-purple-50 dark:bg-purple-900' : 'border-gray-300 dark:border-gray-700'}`}
        >
          <Image
            src={team.logo}
            alt={team.name}
            className="h-12 w-12 mx-auto object-contain mb-2"
            width={48}
            height={48}
            loading="lazy"
          />
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{team.name}</p>
        </div>
      ))}
    </div>
  );
}
