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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3 max-h-96 overflow-y-auto p-1">
      {teams.map((team) => (
        <button
          type="button"
          key={team.id}
          onClick={() => onSelect(team.id.toString())}
          aria-pressed={selectedTeamId === team.id.toString()}
          className={`min-w-0 rounded-md border p-3 cursor-pointer text-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]
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
          <p className="break-words text-sm font-medium text-white leading-tight">{team.name}</p>
        </button>
      ))}
    </div>
  );
}
