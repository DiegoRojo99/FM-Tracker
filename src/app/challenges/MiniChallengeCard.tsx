import React from 'react';
import Link from 'next/link';
import { CareerChallenge, ChallengeWithUser } from '@/lib/types/firebase/Challenge';

type MiniChallengeCardProps = {
  challengeWithUser: ChallengeWithUser;
};

const statusStyles = {
  completed: 'border-green-500 bg-green-50 dark:bg-green-900/40',
  'in-progress': 'border-blue-400 bg-blue-50 dark:bg-blue-900/40',
  'not-started': 'border-gray-300 bg-gray-50 dark:bg-zinc-800/40',
};

function getChallengeStatus(userChallenge?: CareerChallenge): 'completed' | 'in-progress' | 'not-started' {
  if (!userChallenge) return 'not-started';
  if (userChallenge.completedAt) return 'completed';
  return 'in-progress';
}

function getChallengeCompletionPercentage(userChallenge: CareerChallenge | undefined, totalGoals: number): number {
  if (!userChallenge || totalGoals === 0) return 0;
  return Math.floor((userChallenge.completedGoals.length / totalGoals) * 100);
}

const MiniChallengeCard: React.FC<MiniChallengeCardProps> = ({ challengeWithUser }) => {
  const { challenge, userChallenge } = challengeWithUser;
  const status = getChallengeStatus(userChallenge);
  const cardStyle = statusStyles[status];
  
  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className={`relative aspect-square w-full border-2 ${cardStyle} rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 p-2`}
      title={challenge.name}
    >
      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center px-2 flex-grow flex items-center">
        {challenge.name}
      </span>
      <ChallengeProgressBar challengeWithUser={challengeWithUser} />
    </Link>
  );
};

function ChallengeProgressBar({ challengeWithUser }: { challengeWithUser: ChallengeWithUser }) {
  const { challenge, userChallenge } = challengeWithUser;
  const pctCompleted = getChallengeCompletionPercentage(userChallenge, challenge.goals.length);
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
