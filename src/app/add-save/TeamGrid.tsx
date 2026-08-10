'use client'

import { Team } from "@/lib/types/prisma/Team";
import Image from "next/image";

type Props = {
  teams: Team[];
  selectedTeamId: string | null;
  onSelect: (id: string) => void;
};

export default function TeamGrid({ teams, selectedTeamId, onSelect }: Props) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">⚽</div>
        <p>No teams available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 max-h-96 overflow-y-auto pr-2">
      {teams.map((team) => (
        <div
          key={team.id}
          onClick={() => onSelect(team.id.toString())}
          className={`rounded-xl border p-4 cursor-pointer text-center shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
            ${selectedTeamId === team.id.toString()
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15'
              : 'border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] hover:border-[var(--color-accent)]/60'}`}
        >
          <Image
            src={team.logo}
            alt={team.name}
            className="h-12 w-12 mx-auto object-contain mb-3"
            width={48}
            height={48}
            loading="lazy"
          />
          <p className="text-sm font-medium text-white leading-tight">{team.name}</p>
        </div>
      ))}
    </div>
  );
}
