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
import { AnalyticsEvents, trackEvent } from '@/lib/analytics/events';

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  const [savingGame, setSavingGame] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const inputClass = 'w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-4 py-3 text-white focus:border-[var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

  // Fetch countries and games on mount
  useEffect(() => {
    fetch('/api/countries?fmOnly=true').then(res => res.json()).then(setCountries);
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

      trackEvent(AnalyticsEvents.SaveCreated, {
        gameId: selectedGame,
        isUnemployedStart: isNoTeam,
        hasSelectedCountry: Boolean(selectedCountry),
        hasSelectedLeague: Boolean(selectedLeague),
      });

      setSavingGame(false);
      setSubmitSuccess('Save created successfully. Redirecting to your saves...');
      setTimeout(() => {
        router.push(`/saves?created=1&start=${isNoTeam ? 'unemployed' : 'club'}`);
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

  function canProceedFromStep(step: 1 | 2 | 3): boolean {
    if (step === 1) return Boolean(selectedGame);
    if (step === 2) return isNoTeam || Boolean(selectedCountry && selectedLeague && selectedTeam);
    return true;
  }

  const starterChallengeTitle = isNoTeam ? 'Journeyman Starter' : 'Club Builder Starter';
  const starterChallengeDescription = isNoTeam
    ? 'Start with a broad challenge path focused on your first appointment and survival milestones.'
    : 'Start with a challenge path focused on squad building and first-season stability goals.';

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
        <div className="grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <div key={step} className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${currentStep === step ? 'border-[var(--color-highlight)] bg-[var(--color-surface-soft)] text-white' : 'border-[var(--color-surface-border)] bg-[var(--color-darker)]/70 text-[var(--color-text-muted)]'}`}>
              Step {step}: {step === 1 ? 'Setup' : step === 2 ? 'Team' : 'Review'}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <>
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
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {isNoTeam ? (
              <div className="rounded-xl border border-dashed border-[var(--color-accent)] bg-[var(--color-dark)] p-6 text-center">
                <div className="mb-4 text-6xl">🆓</div>
                <h3 className="mb-2 text-xl font-bold text-white">Unemployed Mode</h3>
                <p className="text-gray-300">Start your career without a team and take your first job from the market.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                      <Globe2 className="h-4 w-4 text-[var(--color-highlight)]" />
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={e => setSelectedCountry(e.target.value)}
                      className={inputClass}
                      disabled={!countries.length}
                    >
                      <option value="">-- Select a country --</option>
                      {countries.sort((a, b) => a.name.localeCompare(b.name)).map((c: Country) => (
                        <option key={c.code} value={c.code ?? ''}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                      <ShieldCheck className="h-4 w-4 text-[var(--color-highlight)]" />
                      League
                    </label>
                    <select
                      value={selectedLeague}
                      onChange={e => setSelectedLeague(e.target.value)}
                      disabled={!selectedCountry}
                      className={inputClass}
                    >
                      <option value="">-- Select a league --</option>
                      {leagues.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 transition-opacity duration-200 sm:p-5 ${!selectedLeague ? 'pointer-events-none opacity-50' : ''}`}>
                  {!loadingTeams && (
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
              </>
            )}
          </>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/65 p-4 sm:p-5">
              <h3 className="text-lg font-bold text-white">Review Your Setup</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
                <li>Game: <span className="font-semibold text-white">{selectedGame || 'Not selected'}</span></li>
                <li>Start type: <span className="font-semibold text-white">{isNoTeam ? 'Unemployed' : 'Choose Team'}</span></li>
                {!isNoTeam && (
                  <>
                    <li>Country: <span className="font-semibold text-white">{selectedCountry || 'Not selected'}</span></li>
                    <li>League: <span className="font-semibold text-white">{selectedLeague || 'Not selected'}</span></li>
                    <li>Team: <span className="font-semibold text-white">{selectedTeam || 'Not selected'}</span></li>
                  </>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--color-highlight)]/40 bg-[var(--color-highlight)]/10 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-highlight)]">Starter Challenge Recommendation</p>
              <h4 className="mt-1 text-lg font-bold text-white">{starterChallengeTitle}</h4>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{starterChallengeDescription}</p>
            </div>
          </div>
        )}

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

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : prev))}
            disabled={currentStep === 1 || savingGame}
            className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-6 py-3 font-semibold text-white transition hover:border-[var(--color-highlight)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Back
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev < 3 ? (prev + 1) as 1 | 2 | 3 : prev))}
              disabled={!canProceedFromStep(currentStep)}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={!selectedGame || (!selectedTeam && !isNoTeam) || savingGame}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {savingGame
                ? 'Creating Save...'
                : isNoTeam
                  ? 'Create Unemployed Save'
                  : 'Create Save'
              }
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
