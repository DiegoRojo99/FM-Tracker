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
    return <div>No competitions found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <TrophiesHeader 
        games={games}
        selectedGame={selectedGame}
        onGameChange={setSelectedGame}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
          return <TrophyCountry key={country.code} country={country} trophies={trophies} groupMapping={groupMapping} />;
        })}
      </div>
    </div>
  );
}