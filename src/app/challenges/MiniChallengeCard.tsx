import React from 'react';
import Link from 'next/link';
import { CareerChallengeWithDetails, Challenge } from '@/lib/types/prisma/Challenge';

type MiniChallengeCardProps = {
  userChallenge: CareerChallengeWithDetails | Challenge;
};

const statusStyles = {
  completed: 'border-emerald-400/80 bg-emerald-500/12',
  'in-progress': 'border-[var(--color-highlight)]/70 bg-[var(--color-highlight)]/10',
  'not-started': 'border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]',
};

const statusLabels = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  'not-started': 'Not Started',
} as const;

function getChallengeStatus(userChallenge?: CareerChallengeWithDetails | Challenge): 'completed' | 'in-progress' | 'not-started' {
  if (!userChallenge || !('challenge' in userChallenge)) return 'not-started';
  if ('completedAt' in userChallenge && userChallenge.completedAt) return 'completed';
  return 'in-progress';
}

function getChallengeCompletionPercentage(userChallenge: CareerChallengeWithDetails | undefined): number {
  if (!userChallenge || userChallenge.challenge.goals.length === 0) return 0;
  const totalGoals = userChallenge.challenge.goals.length;
  const completedGoals = userChallenge.goalProgress.filter(gp => gp.isComplete).length;
  return Math.floor((completedGoals / totalGoals) * 100);
}

const MiniChallengeCard: React.FC<MiniChallengeCardProps> = ({ userChallenge }) => {
  const status = getChallengeStatus(userChallenge);
  const cardStyle = statusStyles[status];
  const hasChallengeData = 'challenge' in userChallenge;
  const challengeSlug = hasChallengeData ? userChallenge.challenge.key : userChallenge.key;
  const challengeName = hasChallengeData ? userChallenge.challenge.name : userChallenge.name;
  
  return (
    <Link
      href={`/challenges/${challengeSlug}`}
      className={`group relative flex aspect-square w-full flex-col overflow-hidden rounded-xl border ${cardStyle} p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]`}
      title={challengeName}
    >
      <span className="inline-flex w-fit self-start rounded-full border border-[var(--color-surface-border)] bg-black/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {statusLabels[status]}
      </span>

      <div className="flex flex-1 items-center justify-center px-1">
        <span className="line-clamp-3 text-center text-sm font-bold text-white sm:text-base">
          {challengeName}
        </span>
      </div>

      <ChallengeProgressBar userChallenge={hasChallengeData ? userChallenge : undefined} />
    </Link>
  );
};

function ChallengeProgressBar({ userChallenge }: { userChallenge?: CareerChallengeWithDetails }) {
  const pctCompleted = getChallengeCompletionPercentage(userChallenge);
  if (!userChallenge) {
    return <span className="text-xs font-medium text-[var(--color-text-muted)]">Start challenge</span>;
  }

  if (pctCompleted === 0) return <span className="text-xs font-medium text-[var(--color-text-muted)]">0%</span>;
  
  return (
    <div className="mt-2 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
        <div
          className="h-full bg-[var(--color-highlight)] transition-all duration-300"
          style={{ width: `${pctCompleted}%` }}
        />
      </div>
      <span className="mt-1 block text-right text-xs text-[var(--color-text-muted)]">
        {pctCompleted}%
      </span>
    </div>
  )
}

export default MiniChallengeCard;
