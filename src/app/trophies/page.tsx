'use client';

import { useState } from 'react';
import FootballLoader from '@/app/components/FootBallLoader';
import TrophiesHeader from './TrophiesHeader';
import TrophyCountry from './TrophyCountry';
import { useTrophies } from './useTrophies';
import { Trophy } from 'lucide-react';

export default function TrophiesPage() {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const { countries, trophies, games, loading } = useTrophies(selectedGame);

  if (loading) {
    return <FootballLoader />;
  }

  if (!countries?.length) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 text-center shadow-xl backdrop-blur-sm">
          <Trophy className="mb-4 h-12 w-12 text-[var(--color-highlight)]" />
          <h2 className="text-2xl font-bold text-white">No Competitions Found</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Start tracking your trophies by adding competitions.</p>
        </div>
      </div>
    );
  }

  // Calculate total stats
  const totalCompetitions = countries.reduce((acc, country) => acc + (country.competitions?.length || 0), 0);
  const totalTrophies = trophies.length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <TrophiesHeader 
          games={games}
          selectedGame={selectedGame}
          onGameChange={setSelectedGame}
          totalTrophies={totalTrophies}
          totalCompetitions={totalCompetitions}
        />
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
            return <TrophyCountry key={country.code} country={country} trophies={trophies} />;
          })}
        </div>
      </div>
    </div>
  );
}