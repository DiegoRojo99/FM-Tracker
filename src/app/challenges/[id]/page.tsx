"use client";

import { useEffect, useState } from "react";
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
        <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 shadow-xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-5 py-4 text-[var(--color-danger-soft-text)] shadow-lg">
          Challenge not found.
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[-2rem] h-36 w-36 rounded-full bg-[var(--color-highlight)]/15 blur-3xl" />
          <div className="absolute right-[10%] top-[8%] h-40 w-40 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        </div>

        <h1 className="text-3xl font-black text-white sm:text-4xl">{challenge.name}</h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)] sm:text-lg">{challenge.description}</p>
        {challenge.bonus && (
          <div className="mt-4 inline-flex items-center rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-100">
            Bonus: {challenge.bonus}
          </div>
        )}
        
        {/* Display user progress if logged in */}
        {userChallenges.length > 0 && (() => {
          const selectedChallenge = userChallenges[selectedSaveIndex];
          return (
            <div className="mt-6 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/70 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold text-white">Your Progress</h3>
                {userChallenges.length > 1 && (
                  <select 
                    value={selectedSaveIndex} 
                    onChange={(e) => setSelectedSaveIndex(Number(e.target.value))}
                    className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-dark)] px-3 py-1.5 text-sm text-white focus:border-[var(--color-highlight)] focus:outline-none"
                  >
                    {userChallenges.map((challenge, index) => (
                      <option key={challenge.id} value={index}>
                        {formatSaveLabel(challenge)}
                        {challenge.completedAt ? ' (Completed)' : ' (In Progress)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {selectedChallenge && (
                <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/65 p-4">
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
                                className="h-16 w-16 rounded-full object-cover"
                              />
                            ) : (
                              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-base font-bold text-white/85 shadow-md">
                                FC
                              </span>
                            )}

                            <div>
                              <p className="text-lg font-black leading-tight text-white sm:text-xl">
                                {selectedChallenge.save.currentClub?.name ?? 'No current club'}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--color-text-muted)]/90">
                            Started {new Date(selectedChallenge.startedAt).toLocaleDateString()} · ID: {selectedChallenge.save.id.slice(0, 12)}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-300/35 bg-amber-400/10 px-3 py-2 text-center text-xs text-amber-100 sm:text-left">
                          Save data is missing for this run. New runs should always be linked to a save.
                        </div>
                      )}
                    </div>
                    {selectedChallenge.completedAt && (
                      <span className="self-center text-sm font-semibold text-emerald-300 sm:self-start">
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
      
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
        <h2 className="mb-3 text-xl font-bold text-white">Goals</h2>
        <div className="space-y-3">
          {challenge.goals.map((goal: ChallengeGoalWithDetails) => 
            <ChallengeGoalCard 
              key={goal.id} 
              goal={goal} 
              selectedUserChallenge={userChallenges.length > 0 ? userChallenges[selectedSaveIndex] : null} 
            />
          )}
        </div>
      </section>
    </main>
  );
}
