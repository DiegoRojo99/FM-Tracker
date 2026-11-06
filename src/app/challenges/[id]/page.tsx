"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CareerChallengeWithSaveDetails, ChallengeGoalWithDetails, ChallengeWithGoals } from '@/lib/types/prisma/Challenge';
import FootballLoader from '../../components/FootBallLoader';
import ProgressBar from '../../components/progress/ProgressBar';
import { useAuth } from '../../components/AuthProvider';
import ChallengeGoalCard from "./ChallengeGoalCard";

function formatSaveLabel(run: CareerChallengeWithSaveDetails): string {
  if (!run.save) return `Save record missing - ${run.game.shortName}`;
  const shortSaveId = run.save.id.slice(0, 8);
  const clubName = run.save.currentClub?.name ?? 'No club';
  return `${run.save.season} - ${clubName} - ${run.game.shortName} - ${shortSaveId}`;
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeWithGoals | null>(null);
  const [userChallenges, setUserChallenges] = useState<CareerChallengeWithSaveDetails[]>([]);
  const [selectedSaveIndex, setSelectedSaveIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const sortedUserChallenges = useMemo(() => {
    return [...userChallenges].sort((left, right) => {
      const leftCompleted = Boolean(left.completedAt);
      const rightCompleted = Boolean(right.completedAt);

      // Show active runs first, then completed runs.
      if (leftCompleted !== rightCompleted) return leftCompleted ? 1 : -1;
      return new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime();
    });
  }, [userChallenges]);

  useEffect(() => {
    async function fetchChallenge(challengeKey: string) {
      const headers: HeadersInit = {};
      
      // Add auth token if user is logged in
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/challenges/${encodeURIComponent(challengeKey)}`, { headers });
      if (!res.ok) {
        setChallenge(null);
        setUserChallenges([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setChallenge(data.challenge);
      setUserChallenges(data.userChallenges || []);
      setSelectedSaveIndex(0); // Reset to first save when data changes
      setLoading(false);
    }

    if (typeof params.id === 'string') { fetchChallenge(params.id); }
    else if (Array.isArray(params.id) && params.id.length > 0) { fetchChallenge(params.id[0]); }
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="fm-panel flex min-h-[40vh] items-center justify-center">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-5 py-4 text-[var(--color-danger-soft-text)]">
          Challenge not found.
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="fm-panel p-4 sm:p-5">
        <h1 className="break-words text-3xl font-semibold text-[var(--color-foreground)]">{challenge.name}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{challenge.description}</p>
        {challenge.bonus && (
          <div className="mt-4 inline-flex items-center rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-100">
            Bonus: {challenge.bonus}
          </div>
        )}
        
        {/* Display user progress if logged in */}
        {sortedUserChallenges.length > 0 && (() => {
          const selectedChallenge = sortedUserChallenges[selectedSaveIndex];
          return (
            <div className="mt-5 border-t border-[var(--color-surface-border)] pt-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold text-[var(--color-foreground)]">Your Progress</h3>
                {sortedUserChallenges.length > 1 && (
                  <select 
                    aria-label="Tracked challenge run"
                    value={selectedSaveIndex} 
                    onChange={(e) => setSelectedSaveIndex(Number(e.target.value))}
                    className="fm-field sm:w-auto sm:max-w-sm"
                  >
                    {sortedUserChallenges.map((challenge, index) => (
                      <option key={challenge.id} value={index}>
                        {formatSaveLabel(challenge)}
                        {challenge.completedAt ? ' (Completed)' : ' (In Progress)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {selectedChallenge && (
                <div className="fm-inset p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="w-full">
                      {selectedChallenge.save ? (
                        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <span className="rounded-full border border-[var(--color-surface-border)] bg-[var(--color-dark)]/70 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                              {selectedChallenge.save.season}
                            </span>
                            <span className="rounded-full border border-[var(--color-surface-border)] bg-[var(--color-dark)]/70 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                              {selectedChallenge.game.shortName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 py-2">
                            {selectedChallenge.save.currentClub?.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={selectedChallenge.save.currentClub.logo}
                                alt={selectedChallenge.save.currentClub?.name ?? 'Current club'}
                                className="h-12 w-12 shrink-0 object-contain"
                              />
                            ) : (
                              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-soft)] text-base font-semibold text-[var(--color-foreground)]/85">
                                FC
                              </span>
                            )}

                            <div className="min-w-0">
                              <p className="break-words text-base font-semibold leading-tight text-[var(--color-foreground)]">
                                {selectedChallenge.save.currentClub?.name ?? 'No current club'}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--color-text-muted)]/90">
                            Started {new Date(selectedChallenge.startedAt).toLocaleDateString()} · ID: {selectedChallenge.save.id.slice(0, 12)}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-300/35 bg-amber-400/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-100 sm:text-left">
                          Save data is missing for this run. New runs should always be linked to a save.
                        </div>
                      )}
                    </div>
                    {selectedChallenge.completedAt && (
                      <span className="self-center text-sm font-semibold text-emerald-700 dark:text-emerald-300 sm:self-start">
                        ✓ Completed {new Date(selectedChallenge.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <ProgressBar 
                    completed={selectedChallenge.goalProgress.filter(gp => gp.isComplete).length} 
                    total={selectedChallenge.goalProgress.length} 
                    showText={true}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </header>
      
      <section className="fm-panel mt-5 p-4 sm:p-5">
        <h2 className="mb-3 text-xl font-bold text-[var(--color-foreground)]">Goals</h2>
        <div className="space-y-3">
          {challenge.goals.map((goal: ChallengeGoalWithDetails) => 
            <ChallengeGoalCard 
              key={goal.id} 
              goal={goal} 
              selectedUserChallenge={sortedUserChallenges.length > 0 ? sortedUserChallenges[selectedSaveIndex] : null} 
            />
          )}
        </div>
      </section>
    </main>
  );
}
