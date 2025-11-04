import React from 'react';
import Link from 'next/link';
import { CareerChallenge, ChallengeWithUser } from '@/lib/types/Challenge';

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

const MiniChallengeCard: React.FC<MiniChallengeCardProps> = ({ challengeWithUser }) => {
  const { challenge, userChallenge } = challengeWithUser;
  const cardStyle = statusStyles[getChallengeStatus(userChallenge)];
  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className={`aspect-square w-full border-2 ${cardStyle} rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
      title={challenge.name}
    >
      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center px-2">
        {challenge.name}
      </span>
    </Link>
  );
};

export default MiniChallengeCard;
