'use client';
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/db/firebase";
import { Challenge } from "@/lib/types/Challenge";
import FootballLoader from "../components/FootBallLoader";

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
      <div className="mb-4">
        {challenges.map(challenge => (
          <div key={challenge.id} className="flex flex-col p-4 mb-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold text-black">{challenge.name}</h2>
            <p className="text-gray-700">{challenge.description}</p>
            {challenge.bonus && <p className="text-green-600">Bonus: {challenge.bonus}</p>}
            <h3 className="mt-2 font-semibold text-gray-800">Goals:</h3>
            <ul className="list-disc pl-5">
              {challenge.goals.map((goal, index) => (
                <li key={index} className="text-gray-600">{goal.description}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}