'use client';

import { useState } from 'react';
import FootballLoader from '@/app/components/FootBallLoader';
import TrophiesHeader from './TrophiesHeader';
import TrophyCountry from './TrophyCountry';
import { useTrophies } from './useTrophies';

export default function TrophiesPage() {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const { countries, trophies, groupMapping, games, loading } = useTrophies(selectedGame);

  if (loading) {
    return <FootballLoader />;
  }

  if (!countries?.length) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Competitions Found</h2>
          <p className="text-gray-600 dark:text-gray-400">Start tracking your trophies by adding competitions</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
            return <TrophyCountry key={country.code} country={country} trophies={trophies} groupMapping={groupMapping} />;
          })}
        </div>
      </div>
    </div>
  );
}