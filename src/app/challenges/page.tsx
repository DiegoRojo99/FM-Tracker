'use client';
import { useEffect, useState } from "react";
import { CareerChallenge, Challenge, ChallengeGoal } from "@/lib/types/Challenge";
import FootballLoader from "../components/FootBallLoader";
import BlurredCard from "../components/BlurredCard";
import ProgressBar from "../components/progress/ProgressBar";
import { useAuth } from "../components/AuthProvider";

export default function ChallengesPage() {
  const { user, userLoading } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<CareerChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!user) return;
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [allChallengesRes, userChallengesRes] = await Promise.all([
        fetch('/api/challenges', { headers }),
        fetch('/api/challenges/user', { headers }),
      ]);

      const allChallengesData = await allChallengesRes.json();
      const userChallengesData = await userChallengesRes.json();

      setChallenges(allChallengesData);
      setUserChallenges(userChallengesData);
      setLoading(false);
    }
    
    // Wait for user to be loaded
    if (userLoading) return;
    else if (!user) {
      setLoading(false);
      return;
    }
    else {
      fetchAll();
    }

  }, [user, userLoading]);


  if (loading) return <FootballLoader />;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold m-4 text-white">Challenges</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map(challenge => (
          <div key={challenge.id}>
            <GlobalChallengeCard challenge={challenge} userChallenge={userChallenges.find(uc => uc.id === challenge.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

const GlobalChallengeCard: React.FC<{ challenge: Challenge, userChallenge?: CareerChallenge }> = ({ challenge, userChallenge }) => {
  if (!userChallenge) {
    return (
      <BlurredCard className="h-full">
        <h3 className="text-lg font-semibold text-center">{challenge.name}</h3>
        <p className="text-sm text-gray-400 my-2">{challenge.description}</p>
        {challenge.bonus && (
          <p className="text-sm text-yellow-500 my-2">Bonus: {challenge.bonus}</p>
        )}
        <div className="mt-2">
          {challenge.goals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 my-1">
              <span className={`flex-1`}>
                {goal.description}
              </span>
            </div>
          ))}
        </div>
      </BlurredCard>
    );
  }
  else {
    return (
      <BlurredCard className="h-full">
        <ChallengeCard challenge={userChallenge} />
      </BlurredCard>
    );
  }
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

