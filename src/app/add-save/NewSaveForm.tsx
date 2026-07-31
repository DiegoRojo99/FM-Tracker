'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import TeamGrid from './TeamGrid';
import { Team } from '@/lib/types/prisma/Team';
import { CompetitionGroup, Country } from '../../../prisma/generated/client';
import { Game } from '@/lib/types/prisma/Game';
import { SaveInput } from '@/lib/types/prisma/Save';
import FootballLoader from '@/app/components/FootBallLoader';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ClipboardList, Gamepad2, Globe2, ShieldCheck, Sparkles } from 'lucide-react';

export default function NewSaveForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [leagues, setLeagues] = useState<CompetitionGroup[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedGame, setSelectedGame] = useState('fm26'); // Default to FM26
  const [isNoTeam, setIsNoTeam] = useState(false);
  
  const [savingGame, setSavingGame] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const inputClass = 'w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-4 py-3 text-white focus:border-[var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

  // Fetch countries and games on mount
  useEffect(() => {
    fetch('/api/countries').then(res => res.json()).then(setCountries);
    fetch('/api/games?active=true').then(res => res.json()).then(data => setGames(data.games || []));
  }, []);

  // Fetch leagues when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetch(`/api/competitions?country=${selectedCountry}&type=League&gameId=${selectedGame}`)
        .then(res => res.json())
        .then(setLeagues);
    } 
    else {
      setLeagues([]);
      setSelectedLeague('');
    }
  }, [selectedCountry, selectedGame]);

  // Fetch teams when league changes
  useEffect(() => {
    if (selectedLeague) {
      setLoadingTeams(true);
      fetch(`/api/teams?leagueId=${selectedLeague}&gameId=${selectedGame}`)
        .then(res => res.json())
        .then(data => {
          setTeams(data);
          setLoadingTeams(false);
        });
    } 
    else {
      setTeams([]);
      setSelectedTeam('');
      setLoadingTeams(false);
    }
  }, [selectedLeague, selectedGame]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || (!selectedTeam && !isNoTeam)) return;

    setSubmitError(null);
    setSubmitSuccess(null);
    setSavingGame(true);

    const newSave: SaveInput = {
      gameId: selectedGame,
      countryCode: isNoTeam ? null : selectedCountry,
      leagueId: isNoTeam ? null : Number(selectedLeague),
      startingTeamId: isNoTeam ? null : Number(selectedTeam)
    };

    try {
      const userToken = await user.getIdToken();
      const saveResponse = await fetch('/api/saves', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(newSave),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        setSubmitError(errorText || 'Failed to create save. Please review your selections.');
        setSavingGame(false);
        return;
      }

      setSavingGame(false);
      setSubmitSuccess('Save created successfully. Redirecting to your saves...');
      setTimeout(() => {
        router.push('/saves');
      }, 800);
    }
    catch (error) {
      console.error('Error creating save:', error);
      setSubmitError('Something went wrong while creating the save. Please try again.');
      setSavingGame(false);
    }
  };

  function sortGamesByReleaseDate(a: Game, b: Game) {
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/86 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
          <Sparkles className="h-3.5 w-3.5" />
          New Career Save
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">Create New Save</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Pick your game version, choose your starting setup, and launch the next chapter of your manager story.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
            <label className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
              <Gamepad2 className="h-4 w-4 text-[var(--color-highlight)]" />
              Game Version
            </label>
            <select 
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)} 
              className={inputClass}
            >
              {[...games].sort(sortGamesByReleaseDate).map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
            <label className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
              <Globe2 className="h-4 w-4 text-[var(--color-highlight)]" />
              Country
            </label>
            <select 
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)} 
              className={inputClass}
              disabled={!countries.length || isNoTeam}
            >
              <option value="">-- Select a country --</option>
              {countries.sort((a, b) => a.name.localeCompare(b.name)).map((c: Country) => (
                <option key={c.code} value={c.code ?? ''}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
          <label className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
            <ShieldCheck className="h-4 w-4 text-[var(--color-highlight)]" />
            League
          </label>
          <select 
            value={selectedLeague}
            onChange={e => setSelectedLeague(e.target.value)} 
            disabled={!selectedCountry || isNoTeam} 
            className={inputClass}
          >
            <option value="">-- Select a league --</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
          <label className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
            <ClipboardList className="h-4 w-4 text-[var(--color-highlight)]" />
            Starting Option
          </label>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setIsNoTeam(false);
                setSelectedTeam('');
              }}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                !isNoTeam 
                  ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] text-white shadow-lg' 
                  : 'border border-[var(--color-surface-border)] bg-[var(--color-dark)] text-gray-300'
              }`}
            >
              Choose Team
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNoTeam(true);
                setSelectedTeam('');
                setSelectedCountry('');
                setSelectedLeague('');
              }}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                isNoTeam 
                  ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] text-white shadow-lg' 
                  : 'border border-[var(--color-surface-border)] bg-[var(--color-dark)] text-gray-300'
              }`}
            >
              Unemployed
            </button>
          </div>

          {isNoTeam ? (
            <div className="rounded-xl border border-dashed border-[var(--color-accent)] bg-[var(--color-dark)] p-6 text-center">
              <div className="text-6xl mb-4">🆓</div>
              <h3 className="text-xl font-bold text-white mb-2">Unemployed Mode</h3>
              <p className="text-gray-300">Start your career without being tied to any specific team. Perfect for a challenging journey!</p>
            </div>
          ) : (
            <div className={`transition-opacity duration-200 ${!selectedLeague ? 'opacity-50 pointer-events-none' : ''}`}>
              { !loadingTeams && (
                <TeamGrid
                  teams={teams}
                  selectedTeamId={selectedTeam}
                  onSelect={setSelectedTeam}
                />
              )}
              {loadingTeams && (
                <div className="py-8">
                  <FootballLoader />
                </div>
              )}
            </div>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-text)]">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="inline-flex w-full items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-white">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-highlight)]" />
            {submitSuccess}
          </div>
        )}

        <button
          type="submit"
          disabled={ !selectedGame || (!selectedTeam && !isNoTeam) || savingGame }
          className="w-full rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] px-6 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingGame
            ? 'Creating Save...'
            : isNoTeam
              ? 'Create Unemployed Save'
              : 'Create Save'
          }
        </button>
      </form>
    </div>
  );
}
