import React from 'react';
import MiniChallengeCard from './MiniChallengeCard';
import { CareerChallengeWithDetails, Challenge } from '@/lib/types/prisma/Challenge';

interface ChallengeSectionProps {
  name: string;
  icon: string;
  challenges: (CareerChallengeWithDetails | Challenge)[];
}

const ChallengeSection: React.FC<ChallengeSectionProps> = ({ name, icon, challenges }) => {
  if (challenges.length === 0) return null;
  return (
    <section className="fm-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span role="img" aria-label={name}>{icon}</span> {name}
        </h2>
        <span className="rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
          {challenges.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {challenges.map((userChallenge, index) => (
          <MiniChallengeCard
            key={`challenge-${index}`}
            userChallenge={userChallenge}
          />
        ))}
      </div>
    </section>
  );
};

export default ChallengeSection;
