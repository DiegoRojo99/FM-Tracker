import React from 'react';
import MiniChallengeCard from './MiniChallengeCard';
import { ChallengeWithUser } from '@/lib/types/firebase/Challenge';


interface ChallengeSectionProps {
  name: string;
  icon: string;
  challenges: ChallengeWithUser[];
}

const ChallengeSection: React.FC<ChallengeSectionProps> = ({ name, icon, challenges }) => {
  if (challenges.length === 0) return null;
  return (
    <div>
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
        <span role="img" aria-label={name}>{icon}</span> {name}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {challenges.map((challengeWithUser) => (
          <MiniChallengeCard
            key={challengeWithUser.challenge.id}
            challengeWithUser={challengeWithUser}
          />
        ))}
      </div>
    </div>
  );
};

export default ChallengeSection;
