'use client'

import { useState, useEffect, useRef } from 'react';
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
  const [selectedGame, setSelectedGame] = useState('fm27');
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isNoTeam, setIsNoTeam] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  const [savingGame, setSavingGame] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const [requestId, setRequestId] = useState('');

  const inputClass = 'fm-field';

  function buildRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }

    return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  }

  // Fetch countries and games on mount
  useEffect(() => {
    const controller = new AbortController();
    async function loadSetup() {
      try {
        const [countryResponse, gameResponse] = await Promise.all([
          fetch('/api/countries?fmOnly=true', { signal: controller.signal }),
          fetch('/api/games?active=true', { signal: controller.signal }),
        ]);
        if (!countryResponse.ok || !gameResponse.ok) throw new Error('Failed to load countries or game versions');
        const [countryData, gameData] = await Promise.all([countryResponse.json(), gameResponse.json()]);
        if (!Array.isArray(countryData) || !Array.isArray(gameData.games)) throw new Error('Invalid countries or game versions response');
        if (controller.signal.aborted) return;
        setCountries(countryData);
        setGames(gameData.games);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error loading save setup:', error);
        setSetupError('Could not load countries or game versions. Please reload to try again.');
      }
    }
    void loadSetup();
    setRequestId(buildRequestId());
    return () => controller.abort();
  }, []);

  // Fetch leagues when country changes
  useEffect(() => {
    const controller = new AbortController();
    if (selectedCountry) {
      setSelectionError(null);
      fetch(`/api/competitions?country=${selectedCountry}&type=DOMESTIC_LEAGUE&gameId=${selectedGame}`, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error('Failed to load leagues');
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data)) throw new Error('Invalid leagues response');
          if (!controller.signal.aborted) setLeagues(data);
        })
        .catch(error => {
          if (controller.signal.aborted) return;
          console.error('Error loading leagues:', error);
          setSelectionError('Could not load leagues. Please select the country again to retry.');
        });
    } 
    else {
      setLeagues([]);
      setSelectedLeague('');
    }
    return () => controller.abort();
  }, [selectedCountry, selectedGame]);

  // Fetch teams when league changes
  useEffect(() => {
    const controller = new AbortController();
    if (selectedLeague) {
      setLoadingTeams(true);
      setSelectionError(null);
      fetch(`/api/teams?leagueId=${selectedLeague}&gameId=${selectedGame}`, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error('Failed to load teams');
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data)) throw new Error('Invalid teams response');
          if (!controller.signal.aborted) setTeams(data);
        })
        .catch(error => {
          if (controller.signal.aborted) return;
          console.error('Error loading teams:', error);
          setSelectionError('Could not load teams. Please select the league again to retry.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingTeams(false);
        });
    } 
    else {
      setTeams([]);
      setSelectedTeam('');
      setLoadingTeams(false);
    }
    return () => controller.abort();
  }, [selectedLeague, selectedGame]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentStep !== 3) return;
    if (!user || (!selectedTeam && !isNoTeam)) return;
    if (savingGame || submitLockRef.current) return;

    submitLockRef.current = true;

    setSubmitError(null);
    setSubmitSuccess(null);
    setSavingGame(true);

    const activeRequestId = requestId || buildRequestId();
    if (!requestId) setRequestId(activeRequestId);

    const newSave: SaveInput = {
      gameId: selectedGame,
      countryCode: isNoTeam ? null : selectedCountry,
      leagueId: isNoTeam ? null : Number(selectedLeague),
      startingTeamId: isNoTeam ? null : Number(selectedTeam),
      requestId: activeRequestId,
    };

    try {
      const userToken = await user.getIdToken();
      const saveResponse = await fetch('/api/saves', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': activeRequestId,
        },
        body: JSON.stringify(newSave),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        setSubmitError(errorText || 'Failed to create save. Please review your selections.');
        return;
      }

      trackEvent(AnalyticsEvents.SaveCreated, {
        gameId: selectedGame,
        isUnemployedStart: isNoTeam,
        hasSelectedCountry: Boolean(selectedCountry),
        hasSelectedLeague: Boolean(selectedLeague),
      });

      setSubmitSuccess('Save created successfully. Redirecting to your saves...');
      setRequestId(buildRequestId());
      setTimeout(() => {
        router.push(`/saves?created=1&start=${isNoTeam ? 'unemployed' : 'club'}`);
      }, 800);
    }
    catch (error) {
      console.error('Error creating save:', error);
      setSubmitError('Something went wrong while creating the save. Please try again.');
    } finally {
      submitLockRef.current = false;
      setSavingGame(false);
    }
  };

  function sortGamesByReleaseDate(a: Game, b: Game) {
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  }

  function canProceedFromStep(step: 1 | 2 | 3): boolean {
    if (step === 1) return games.some(game => game.id === selectedGame);
    if (step === 2) return isNoTeam || Boolean(selectedCountry && selectedLeague && teams.some(team => String(team.id) === selectedTeam) && !loadingTeams);
    return true;
  }

  const starterChallengeTitle = isNoTeam ? 'Journeyman Starter' : 'Club Builder Starter';
  const starterChallengeDescription = isNoTeam
    ? 'Start with a broad challenge path focused on your first appointment and survival milestones.'
    : 'Start with a challenge path focused on squad building and first-season stability goals.';

  const sortedLeagues = [...leagues].sort((a, b) => {
    const genderRankA = a.isFemale === true ? 1 : 0;
    const genderRankB = b.isFemale === true ? 1 : 0;
    if (genderRankA !== genderRankB) return genderRankA - genderRankB;

    const tierA = a.tier ?? Number.MAX_SAFE_INTEGER;
    const tierB = b.tier ?? Number.MAX_SAFE_INTEGER;
    if (tierA !== tierB) return tierA - tierB;

    return a.name.localeCompare(b.name);
  });

  const selectedLeagueDetails = leagues.find((league) => String(league.id) === selectedLeague) ?? null;
  const selectedGameDetails = games.find(game => game.id === selectedGame);
  const selectedCountryDetails = countries.find(country => country.code === selectedCountry);
  const selectedTeamDetails = teams.find(team => String(team.id) === selectedTeam);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          <Sparkles className="h-3.5 w-3.5" />
          New Career Save
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Create New Save</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Pick your game version, choose your starting setup, and launch the next chapter of your manager story.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          FM27 starts in 2026/27. Choose a country and a men&apos;s or women&apos;s domestic league to see its teams, or start unemployed.
          Select an older game version to track an older career.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="fm-panel space-y-4 p-4 sm:p-6">
        <div className="grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <div key={step} aria-current={currentStep === step ? 'step' : undefined} className={`rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${currentStep === step ? 'border-[var(--color-accent)] bg-[var(--color-primary)]/15 text-[var(--color-accent)]' : 'border-[var(--color-surface-border)] bg-[var(--color-darker)] text-[var(--color-text-muted)]'}`}>
              Step {step}: {step === 1 ? 'Setup' : step === 2 ? 'Team' : 'Review'}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <>
            <div className="fm-inset space-y-2 p-4">
              <label htmlFor="saveGameVersion" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                <Gamepad2 className="h-4 w-4 text-[var(--color-highlight)]" />
                Game Version
              </label>
              <select
                id="saveGameVersion"
                value={selectedGame}
                onChange={e => {
                  setSelectedGame(e.target.value);
                  setSelectedLeague('');
                  setSelectedTeam('');
                  setLeagues([]);
                  setTeams([]);
                }}
                disabled={!games.length}
                className={inputClass}
              >
                {!games.length && <option value="fm27">Loading game versions...</option>}
                {[...games].sort(sortGamesByReleaseDate).map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="fm-inset space-y-3 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                <ClipboardList className="h-4 w-4 text-[var(--color-highlight)]" />
                Starting Option
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNoTeam(false);
                    setSelectedTeam('');
                  }}
                  aria-pressed={!isNoTeam}
                  className="fm-choice"
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
                  aria-pressed={isNoTeam}
                  className="fm-choice"
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
              <div className="fm-inset border-dashed border-[var(--color-accent)] p-5 text-center">
                <div className="mb-3 text-3xl">🆓</div>
                <h3 className="mb-2 text-xl font-bold text-white">Unemployed Mode</h3>
                <p className="text-gray-300">Start your career without a team and take your first job from the market.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="fm-inset space-y-2 p-4">
                    <label htmlFor="saveCountry" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                      <Globe2 className="h-4 w-4 text-[var(--color-highlight)]" />
                      Country
                    </label>
                    <select
                      id="saveCountry"
                      value={selectedCountry}
                      onChange={e => {
                        setSelectedCountry(e.target.value);
                        setSelectedLeague('');
                        setSelectedTeam('');
                        setLeagues([]);
                        setTeams([]);
                      }}
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

                  <div className="fm-inset space-y-2 p-4">
                    <label htmlFor="saveLeague" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                      <ShieldCheck className="h-4 w-4 text-[var(--color-highlight)]" />
                      League
                    </label>
                    <select
                      id="saveLeague"
                      value={selectedLeague}
                      onChange={e => {
                        setSelectedLeague(e.target.value);
                        setSelectedTeam('');
                        setTeams([]);
                      }}
                      disabled={!selectedCountry}
                      className={inputClass}
                    >
                      <option value="">-- Select a league --</option>
                      {sortedLeagues.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                          {l.isFemale === true ? ' (Women)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`fm-inset p-4 transition-opacity duration-200 ${!selectedLeague ? 'pointer-events-none opacity-50' : ''}`}>
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
            <div className="fm-inset p-4">
              <h3 className="text-lg font-bold text-white">Review Your Setup</h3>
              <ul className="mt-3 space-y-2 break-words text-sm text-[var(--color-text-muted)]">
                <li>Game: <span className="font-semibold text-white">{selectedGameDetails?.name ?? 'Not selected'}</span></li>
                <li>Start type: <span className="font-semibold text-white">{isNoTeam ? 'Unemployed' : 'Choose Team'}</span></li>
                {!isNoTeam && (
                  <>
                    <li>Country: <span className="font-semibold text-white">{selectedCountryDetails?.name ?? 'Not selected'}</span></li>
                    <li>League: <span className="font-semibold text-white">{selectedLeagueDetails?.name ?? 'Not selected'}{selectedLeagueDetails?.isFemale === true ? ' (Women)' : ''}</span></li>
                    <li>Team: <span className="font-semibold text-white">{selectedTeamDetails?.name ?? 'Not selected'}</span></li>
                  </>
                )}
              </ul>
            </div>

            <div className="fm-inset border-[var(--color-accent)]/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Starter Challenge Recommendation</p>
              <h4 className="mt-1 text-lg font-bold text-white">{starterChallengeTitle}</h4>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{starterChallengeDescription}</p>
            </div>
          </div>
        )}

        {(setupError || selectionError) && (
          <p role="alert" className="rounded-xl border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] p-4 text-sm text-[var(--color-danger-soft-text)]">
            {setupError || selectionError}
          </p>
        )}

        {submitError && (
          <div role="alert" className="rounded-md border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-text)]">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div role="status" className="inline-flex w-full items-center gap-2 rounded-md border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-white">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
            {submitSuccess}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : prev))}
            disabled={currentStep === 1 || savingGame}
            className="fm-secondary w-full sm:w-auto"
          >
            Back
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev < 3 ? (prev + 1) as 1 | 2 | 3 : prev))}
              disabled={!canProceedFromStep(currentStep)}
              className="fm-action w-full sm:w-auto"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={!selectedGame || (!selectedTeam && !isNoTeam) || savingGame}
              className="fm-action w-full sm:w-auto"
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
