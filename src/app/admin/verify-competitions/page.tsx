'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, updateDoc, doc, deleteDoc, getFirestore } from 'firebase/firestore';

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
  
  async function handleDelete(countryId: string, competitionId: string) {
    if (!window.confirm('Are you sure you want to delete this competition?')) return;
    const newData = { ...data };
    newData[countryId].competitions = newData[countryId].competitions.filter(c => c.id !== competitionId);
    setData(newData);
    await deleteDoc(doc(db, `countries/${countryId}/competitions/${competitionId}`));
  }

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
            {competitions.map((comp, index) => (
              <li key={comp.id} className={`flex items-center space-x-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-200'} p-2 rounded`}>
                {/* {comp.logo && <img src={comp.logo} alt="logo" className="h-6 w-6" />} */}
                <span className='flex-1'>{comp.id}</span>
                <span className="flex-6">{comp.name}</span>
                <input
                  type="checkbox"
                  checked={comp.inFootballManager}
                  onChange={() => handleToggle(countryId, comp.id)}
                />
                <button
                  className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-700"
                  onClick={() => handleDelete(countryId, comp.id)}
                  title="Delete competition"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
