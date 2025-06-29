import BlurredCard from "@/app/components/BlurredCard";
import ProgressBar from "@/app/components/progress/ProgressBar";
import { CareerChallenge, ChallengeGoal } from "@/lib/types/Challenge";
import React from "react";

type ChallengeSectionProps = {
  challenges: CareerChallenge[];
};

const ChallengeSection: React.FC<ChallengeSectionProps> = ({ challenges }) => {

  if (!challenges || challenges.length === 0) {
    return (
      <section className="mt-8 mb-4">
        <h2 className="text-xl font-semibold">Active Challenges</h2>
        <p className="text-sm text-gray-500 mt-4">No challenges yet</p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Active Challenges</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {challenges.map((challenge) => (
          <div key={challenge.id} style={{ marginBottom: "1rem" }}>
            <BlurredCard>
              <ChallengeCard challenge={challenge} />
            </BlurredCard>
          </div>
        ))}
      </div>
    </section>
  );
};

const ChallengeCard: React.FC<{ challenge: CareerChallenge }> = ({ challenge }) => {
  const totalGoals = challenge.goals.length;
  const completedGoals = challenge.completedGoals.length;
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-center">{challenge.name}</h3>
      <p className="text-sm text-gray-400 my-2">{challenge.description}</p>
      <ProgressBar completed={completedGoals} total={totalGoals} showText={false} />
      <div className="mt-2">
        {challenge.goals.map((goal) => (
          <ChallengeGoalUI key={goal.id} goal={goal} isCompleted={challenge.completedGoals.includes(goal.id)} />
        ))}
      </div>
    </div>
  );
};

const ChallengeGoalUI: React.FC<{ goal: ChallengeGoal, isCompleted: boolean }> = ({ goal, isCompleted }) => {
  return (
    <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 my-1">
      <span className={`flex-1 ${isCompleted ? "line-through" : ""}`}>
        {goal.description}
      </span>
      <span
        style={{
          color: isCompleted ? "green" : "gray",
          fontWeight: "bold",
          marginLeft: "1em",
        }}
      >
        {isCompleted ? "✓ Completed" : "Incomplete"}
      </span>
    </div>
  );
};

export default ChallengeSection;