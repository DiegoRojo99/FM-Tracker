'use client';
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/db/firebase";
import { Challenge } from "@/lib/types/Challenge";
import FootballLoader from "../components/FootBallLoader";
import BlurredCard from "../components/BlurredCard";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      const querySnapshot = await getDocs(collection(db, "challenges"));
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data() as Challenge,
      }));
      setChallenges(data);
      setLoading(false);
    }
    fetchChallenges();
  }, []);

  if (loading) return <FootballLoader />;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold m-4 text-white">Challenges</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map(challenge => (
          <div key={challenge.id}>
            <GlobalChallengeCard challenge={challenge} />
          </div>
        ))}
      </div>
    </div>
  );
}

const GlobalChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => {  
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
};
