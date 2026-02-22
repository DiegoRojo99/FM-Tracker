import React, { use } from 'react';
import Link from 'next/link';
import { CareerChallengeWithDetails, Challenge } from '@/lib/types/prisma/Challenge';

type MiniChallengeCardProps = {
  userChallenge: CareerChallengeWithDetails | Challenge;
};

const statusStyles = {
  completed: 'border-green-500 bg-green-50 dark:bg-green-900/40',
  'in-progress': 'border-blue-400 bg-blue-50 dark:bg-blue-900/40',
  'not-started': 'border-gray-300 bg-gray-50 dark:bg-zinc-800/40',
};

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
  const challengeId = hasChallengeData ? userChallenge.challenge.id : userChallenge.id;
  const challengeName = hasChallengeData ? userChallenge.challenge.name : userChallenge.name;
  
  return (
    <Link
      href={`/challenges/${challengeId}`}
      className={`relative aspect-square w-full border-2 ${cardStyle} rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 p-2`}
      title={challengeName}
    >
      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center px-2 flex-grow flex items-center">
        {challengeName}
      </span>
      <ChallengeProgressBar userChallenge={hasChallengeData ? userChallenge : undefined} />
    </Link>
  );
};

function ChallengeProgressBar({ userChallenge }: { userChallenge?: CareerChallengeWithDetails }) {
  const pctCompleted = getChallengeCompletionPercentage(userChallenge);
  if (pctCompleted === 0) return null;
  
  return (
    <div className="w-full mt-2">
      <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 transition-all duration-300"
          style={{ width: `${pctCompleted}%` }}
        />
      </div>
      <span className="block text-xs text-gray-700 dark:text-gray-200 text-right mt-1">
        {pctCompleted}%
      </span>
    </div>
  )
}

export default MiniChallengeCard;
