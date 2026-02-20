import BlurredCard from "@/app/components/BlurredCard";
import ProgressBar from "@/app/components/progress/ProgressBar";
import { CareerChallengeGoal, CareerChallengeWithDetails, ChallengeGoalWithDetails } from "@/lib/types/prisma/Challenge";
import React from "react";

type ChallengeSectionProps = {
  challenges: CareerChallengeWithDetails[];
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
              <ChallengeCard careerChallenge={challenge} />
            </BlurredCard>
          </div>
        ))}
      </div>
    </section>
  );
};

const ChallengeCard: React.FC<{ careerChallenge: CareerChallengeWithDetails }> = ({ careerChallenge }) => {
  const totalGoals = careerChallenge.goalProgress.length;
  const completedGoals = careerChallenge.goalProgress.filter(gp => gp.isComplete).length;
  const challenge = careerChallenge.challenge;
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-center">{challenge.name}</h3>
      <p className="text-sm text-gray-400 my-2">{challenge.description}</p>
      <ProgressBar completed={completedGoals} total={totalGoals} showText={false} />
      <div className="mt-2">
        {challenge.goals.map((goal) => {
          const careerGoalProgress: CareerChallengeGoal | undefined = careerChallenge.goalProgress.find(gp => gp.challengeGoalId === goal.id);
          return <ChallengeGoalUI key={goal.id} goal={goal} careerGoal={careerGoalProgress} />;
        })}
      </div>
    </div>
  );
};

const ChallengeGoalUI: React.FC<{ goal: ChallengeGoalWithDetails, careerGoal?: CareerChallengeGoal }> = ({ goal, careerGoal }) => {
  const isCompleted = careerGoal?.isComplete ?? false;
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