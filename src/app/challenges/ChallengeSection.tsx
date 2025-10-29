import React from 'react';
import MiniChallengeCard from './MiniChallengeCard';
import { Challenge } from '@/lib/types/Challenge';


interface ChallengeSectionProps {
  name: string;
  icon: string;
  challenges: Array<{
    challenge: Challenge;
    status?: 'completed' | 'in-progress' | 'not-started';
  }>;
}

const ChallengeSection: React.FC<ChallengeSectionProps> = ({ name, icon, challenges }) => {
  if (challenges.length === 0) return null;
  return (
    <div>
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
        <span role="img" aria-label={name}>{icon}</span> {name}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {challenges.map(({ challenge, status }) => (
          <MiniChallengeCard
            key={challenge.id}
            challenge={challenge}
            status={status}
          />
        ))}
      </div>
    </div>
  );
};

export default ChallengeSection;
