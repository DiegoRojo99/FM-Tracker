'use client';
import ChallengeSection from './ChallengeSection';
import { useEffect, useState } from "react";
import Link from 'next/link';
import { CareerChallengeWithDetails, Challenge } from "@/lib/types/prisma/Challenge";
import { ChallengesPageSkeleton } from './ChallengesPageSkeleton';
import { useAuth } from "../components/AuthProvider";
import { Flag, SlidersHorizontal } from 'lucide-react';

function getChallengeStatus(userChallenge?: CareerChallengeWithDetails): 'completed' | 'in-progress' | 'not-started' {
  if (!userChallenge) return 'not-started';
  if (userChallenge.completedAt) return 'completed';
  return 'in-progress';
}

function getChallengeCompletionPercentage(userChallenge: CareerChallengeWithDetails | undefined): number {
  if (!userChallenge || userChallenge.challenge.goals.length === 0) return 0;
  const totalGoals = userChallenge.challenge.goals.length;
  const completedGoals = userChallenge.goalProgress.filter(gp => gp.isComplete).length;
  return Math.floor((completedGoals / totalGoals) * 100);
}

function getBestUserChallengeForChallenge(challenge: Challenge, userChallenges: CareerChallengeWithDetails[]): CareerChallengeWithDetails | undefined {
  const matchingChallenges = userChallenges.filter(uc => uc.challengeId === challenge.id);
  if (matchingChallenges.length === 0) return undefined;

  let bestChallenge: CareerChallengeWithDetails | undefined = undefined;
  for (const uc of matchingChallenges) {
    if (!bestChallenge) bestChallenge = uc;
    else {
      const completionPct = getChallengeCompletionPercentage(uc);
      const bestCompletionPct = getChallengeCompletionPercentage(bestChallenge);
      if (completionPct > bestCompletionPct) bestChallenge = uc;
    }
  }
  return bestChallenge;
}


export default function ChallengesPage() {
  const { user, userLoading } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<CareerChallengeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const gameOptions = Array.from(
    new Map(userChallenges.map(attempt => [attempt.gameId, attempt.game])).values()
  );
  
  useEffect(() => {
    async function fetchUserChallenges(): Promise<CareerChallengeWithDetails[] | undefined> {
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/challenges/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Failed to fetch user challenges:', response.statusText);
        return;
      }

      const data = await response.json();
      return data;
    }

    async function fetchChallenges(): Promise<Challenge[] | undefined> {
      const response = await fetch('/api/challenges');
      if (!response.ok) {
        console.error('Failed to fetch challenges:', response.statusText);
        return;
      }

      const data = await response.json();
      return data;
    }

    async function fetchAll() {
      // Always fetch challenges, regardless of login status
      const allChallengesData = await fetchChallenges();
      setChallenges(allChallengesData || []);

      // Only fetch user challenges if user is logged in
      if (!user) setUserChallenges([]);
      else {
        const userChallengesData = await fetchUserChallenges();
        setUserChallenges(userChallengesData || []);
      }

      setLoading(false);
    }

    // Wait for user to be loaded, then fetch data
    if (userLoading) return;
    fetchAll();

  }, [user, userLoading]);

  // Compute unique tags from all challenges, sorted alphabetically
  const allTags = Array.from(
    new Set(challenges.flatMap(c => c.tags ?? []))
  ).sort();

  // Filter userChallenges by selected game
  const filteredUserChallenges = selectedGame
    ? userChallenges.filter(uc => uc.gameId === selectedGame)
    : userChallenges;

  // Apply tag filter to the full challenge list before grouping
  const visibleChallenges = selectedTag
    ? challenges.filter(c => c.tags?.includes(selectedTag))
    : challenges;

  if (loading) {
    return <ChallengesPageSkeleton />;
  }

  // Group challenges by status
  const challengeGroups: { [key: string]: (CareerChallengeWithDetails | Challenge)[] } = {
    'in-progress': [],
    'not-started': [],
    'completed': [],
  };

  visibleChallenges.forEach(challenge => {
    const userChallenge = getBestUserChallengeForChallenge(challenge, filteredUserChallenges);
    const status = getChallengeStatus(userChallenge);
    if (userChallenge) challengeGroups[status].push(userChallenge);
    else challengeGroups['not-started'].push(challenge);
  });

  // Section order: in-progress, not-started, completed
  const sectionOrder: Array<{ key: 'in-progress' | 'not-started' | 'completed', label: string, icon: string }> = [
    { key: 'in-progress', label: 'In Progress', icon: '⏳' },
    { key: 'not-started', label: 'Not Started', icon: '🔒' },
    { key: 'completed', label: 'Completed', icon: '🏆' },
  ];

  const inProgressCount = challengeGroups['in-progress'].length;
  const completedCount = challengeGroups['completed'].length;
  const totalCount = visibleChallenges.length;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="fm-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Progress Board</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Challenges</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Track long-term goals and milestone runs across saves.</p>
          </div>

          {gameOptions.length > 0 && (
            <div className="w-full sm:w-72">
              <label htmlFor="game-select" className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-highlight)]" />
                Filter by Game
              </label>
              <select
                id="game-select"
                value={selectedGame}
                onChange={e => setSelectedGame(e.target.value)}
                className="fm-field"
              >
                <option value="">All Games</option>
                {gameOptions.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Filter by Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                aria-pressed={selectedTag === ''}
                className="fm-choice"
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  aria-pressed={selectedTag === tag}
                  className="fm-choice capitalize"
                >
                  {tag.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="fm-inset p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Total Challenges</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-white">{totalCount}</p>
          </div>
          <div className="fm-inset p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">In Progress</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-white">{inProgressCount}</p>
          </div>
          <div className="fm-inset p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Completed</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-white">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {user && totalCount > 0 && filteredUserChallenges.length === 0 && (
          <div className="fm-panel border-[var(--color-accent)]/35 p-4">
            <h2 className="text-lg font-bold text-white">No active challenges yet</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Start one challenge now to unlock progression, achievement momentum, and clearer next steps for this save.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="#challenge-sections" className="fm-action">
                Pick a Starter Challenge
              </a>
              <Link href="/saves" className="fm-secondary">
                Back to Saves
              </Link>
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <div className="fm-panel p-6 text-center">
            <Flag className="mx-auto h-8 w-8 text-[var(--color-highlight)]" />
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">No challenges available right now.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/saves" className="fm-action">
                Create or Open a Save
              </Link>
              <Link href="/trophies" className="fm-secondary">
                Explore Trophy Tracker
              </Link>
            </div>
          </div>
        )}

        <div id="challenge-sections" className="space-y-5">
          {sectionOrder.map(section => {
            const sectionChallenges = challengeGroups[section.key];
            return (
              <ChallengeSection
                key={section.key}
                name={section.label}
                icon={section.icon}
                challenges={sectionChallenges}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}




// MiniChallengeCard component removed as it is no longer used


