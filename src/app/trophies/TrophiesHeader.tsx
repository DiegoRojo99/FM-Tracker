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
    <div>
      <div className="fm-panel p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Silverware Tracker</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold text-[var(--color-foreground)]">
            <Trophy className="h-7 w-7 shrink-0 text-[var(--color-accent)]" />
            <span>Trophy Cabinet</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Track your competition victories across countries and game versions.
          </p>
        </div>
        
        {games.length > 0 && (
          <div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
            <div>
              <label htmlFor="game-select" className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-highlight)]" />
                Filter by Game
              </label>
              <select
                id="game-select"
                value={selectedGame}
                onChange={(e) => onGameChange(e.target.value)}
                className="fm-field"
              >
                <option value="all">All Games</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gender-select" className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-highlight)]" />
                Filter by Gender
              </label>
              <select
                id="gender-select"
                value={selectedGender}
                onChange={(e) => onGenderChange(e.target.value as 'all' | 'men' | 'women')}
                className="fm-field"
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
        <div className="fm-inset p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Trophies Won</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[var(--color-foreground)]">{totalTrophies}</div>
        </div>
        <div className="fm-inset p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Competitions</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[var(--color-foreground)]">{totalCompetitions}</div>
        </div>
        <div className="fm-inset p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Completion</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[var(--color-foreground)]">{completionPercentage}%</div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TrophiesHeader;
