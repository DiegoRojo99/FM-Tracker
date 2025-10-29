import React from 'react';
import { Challenge } from '@/lib/types/Challenge';

const statusStyles = {
  completed: 'border-green-500 bg-green-50 dark:bg-green-900/40',
  'in-progress': 'border-blue-400 bg-blue-50 dark:bg-blue-900/40',
  'not-started': 'border-gray-300 bg-gray-50 dark:bg-zinc-800/40',
};

type MiniChallengeCardProps = {
  challenge: Challenge;
  status?: 'completed' | 'in-progress' | 'not-started';
  onClick: () => void;
};

const MiniChallengeCard: React.FC<MiniChallengeCardProps> = ({ challenge, status, onClick }) => {
  const cardStyle = status ? statusStyles[status] : statusStyles['not-started'];
  return (
    <button
      className={`aspect-square w-full border-2 ${cardStyle} rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
      title={challenge.name}
      onClick={onClick}
    >
      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center px-2">
        {challenge.name}
      </span>
    </button>
  );
};

export default MiniChallengeCard;
