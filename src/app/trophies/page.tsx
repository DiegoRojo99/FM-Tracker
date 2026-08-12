'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import FootballLoader from '@/app/components/FootBallLoader';
import TrophiesHeader from './TrophiesHeader';
import TrophyCountry from './TrophyCountry';
import { useTrophies } from './useTrophies';
import { Trophy } from 'lucide-react';

export default function TrophiesPage() {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'men' | 'women'>('all');
  const { countries, trophies, games, loading } = useTrophies(selectedGame);

  const genderMatch = (isFemale: boolean | null | undefined): boolean => {
    if (selectedGender === 'women') return isFemale === true;
    if (selectedGender === 'men') return isFemale !== true;
    return true;
  };

  const filteredCountries = useMemo(() => {
    return countries
      .map((country) => ({
        ...country,
        competitions: (country.competitions || []).filter((competition) => genderMatch(competition.isFemale)),
      }))
      .filter((country) => (country.competitions?.length || 0) > 0);
  }, [countries, selectedGender]);

  const filteredTrophies = useMemo(() => {
    return trophies.filter((group) => genderMatch(group.competitionGroup.isFemale));
  }, [trophies, selectedGender]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[52vh] items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!filteredCountries?.length) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 text-center shadow-xl backdrop-blur-sm">
          <Trophy className="mb-4 h-12 w-12 text-[var(--color-highlight)]" />
          <h2 className="text-2xl font-bold text-white">No Competitions Found</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Start tracking your trophies by adding competitions.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/saves" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[var(--color-background)] transition hover:opacity-90">
              Open My Saves
            </Link>
            <Link href="/challenges" className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-highlight)]">
              Start a Challenge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total stats
  const totalCompetitions = filteredCountries.reduce((acc, country) => acc + (country.competitions?.length || 0), 0);
  const totalTrophies = filteredTrophies.length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <TrophiesHeader 
          games={games}
          selectedGame={selectedGame}
          onGameChange={setSelectedGame}
          selectedGender={selectedGender}
          onGenderChange={setSelectedGender}
          totalTrophies={totalTrophies}
          totalCompetitions={totalCompetitions}
        />

        {filteredTrophies.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-highlight)]/35 bg-[var(--color-highlight)]/10 p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white">No trophy milestones recorded yet</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Your first trophy is a key activation milestone. Add one from a save to begin your cabinet timeline.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/saves" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[var(--color-background)] transition hover:opacity-90">
                Add Milestone From Save
              </Link>
              <Link href="/challenges" className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-highlight)]">
                Find Trophy-Oriented Challenges
              </Link>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCountries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
            return <TrophyCountry key={country.code} country={country} trophies={filteredTrophies} />;
          })}
        </div>
      </div>
    </div>
  );
}