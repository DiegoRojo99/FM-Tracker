'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, updateDoc, doc, getFirestore } from 'firebase/firestore';

type CountryCompetitions = {
  countryName: string;
  competitions: {
    id: string;
    name: string;
    logo?: string;
    inFootballManager: boolean;
  }[];
};

export default function VerifyFMCompetitionsPage() {
  const [data, setData] = useState<Record<string, CountryCompetitions>>({});
  const db = getFirestore();

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collectionGroup(db, 'competitions'));
      const grouped: Record<string, CountryCompetitions> = {};

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const countryId = docSnap.ref.parent.parent?.id;
        if (!countryId) return;

        if (!grouped[countryId]) {
          grouped[countryId] = {
            countryName: data.countryName || countryId,
            competitions: [],
          };
        }

        grouped[countryId].competitions.push({
          id: docSnap.id,
          name: data.name,
          logo: data.logo,
          inFootballManager: data.inFootballManager ?? false,
        });
      });

      setData(grouped);
    }

    fetchData();
  }, [db]);

  async function handleToggle(countryId: string, competitionId: string) {
    const newData = { ...data };
    const competition = newData[countryId].competitions.find(c => c.id === competitionId);
    if (!competition) return;

    const newValue = !competition.inFootballManager;
    competition.inFootballManager = newValue;
    setData(newData);

    await updateDoc(
      doc(db, `countries/${countryId}/competitions/${competitionId}`),
      { inFootballManager: newValue }
    );
  }

  return (
    <div className="p-6 space-y-6 text-black">
      <h1 className="text-2xl font-bold text-white">Verify Football Manager Competitions</h1>
      {Object.entries(data).sort((a, b) => a[1].countryName.localeCompare(b[1].countryName)).map(([countryId, { countryName, competitions }]) => (
        <div key={countryId} className="bg-gray-100 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">{countryName}</h2>
          <ul className="space-y-2">
            {competitions.map((comp) => (
              <li key={comp.id} className="flex items-center space-x-4">
                {/* {comp.logo && <img src={comp.logo} alt="logo" className="h-6 w-6" />} */}
                <span className="flex-1">{comp.name}</span>
                <input
                  type="checkbox"
                  checked={comp.inFootballManager}
                  onChange={() => handleToggle(countryId, comp.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
