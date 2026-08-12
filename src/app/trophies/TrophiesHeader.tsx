import React from 'react';
import { Game } from '@/lib/types/prisma/Game';
import { SlidersHorizontal, Trophy } from 'lucide-react';

interface TrophiesHeaderProps {
  games: Game[];
  selectedGame: string;
  onGameChange: (game: string) => void;
  selectedGender: 'all' | 'men' | 'women';
  onGenderChange: (gender: 'all' | 'men' | 'women') => void;
  totalTrophies?: number;
  totalCompetitions?: number;
}

const TrophiesHeader: React.FC<TrophiesHeaderProps> = ({ 
  games, 
  selectedGame, 
  onGameChange,
  selectedGender,
  onGenderChange,
  totalTrophies = 0,
  totalCompetitions = 0
}) => {
  const completionPercentage = totalCompetitions > 0 
    ? Math.round((totalTrophies / totalCompetitions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Silverware Tracker</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-white sm:text-4xl">
            <Trophy className="h-8 w-8 text-[var(--color-highlight)]" />
            <span>Trophy Cabinet</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Track your competition victories across countries and game versions.
          </p>
        </div>
        
        {games.length > 0 && (
          <div className="grid w-full grid-cols-1 gap-3 sm:w-[28rem] sm:grid-cols-2">
            <div>
              <label htmlFor="game-select" className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-highlight)]" />
                Filter by Game
              </label>
              <select
                id="game-select"
                value={selectedGame}
                onChange={(e) => onGameChange(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="all">All Games</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gender-select" className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-highlight)]" />
                Filter by Gender
              </label>
              <select
                id="gender-select"
                value={selectedGender}
                onChange={(e) => onGenderChange(e.target.value as 'all' | 'men' | 'women')}
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="all">All</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Trophies Won</div>
          <div className="mt-1 text-3xl font-black text-white">{totalTrophies}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Competitions</div>
          <div className="mt-1 text-3xl font-black text-white">{totalCompetitions}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Completion</div>
          <div className="mt-1 text-3xl font-black text-white">{completionPercentage}%</div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TrophiesHeader;
