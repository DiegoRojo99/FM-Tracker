'use client';
import { useAuth } from '@/app/components/AuthProvider';
import { CareerStint } from '@/lib/types/InsertDB';
import { Save } from '@/lib/types/RetrieveDB';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CareerStintUI from './CareerStint';

export default function SavePage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [saveDetails, setSaveDetails] = useState<Save | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      // Ensure we have an ID and user before proceeding
      if (!id) {
        console.error('No ID provided in URL parameters');
        notFound();
      }

      // Check if user is authenticated
      if (!user) return;
      
      const token = await user.getIdToken();
      const res = await fetch(`/api/saves/${id}`, { 
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (!res.ok) return null;

      // Check if the response is valid
      const data = await res.json();
      if (!data) notFound();

      // Set the save details state
      console.log('Fetched save details:', data);
      setSaveDetails(data);
      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!saveDetails) {
    notFound();
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Career Stints</h2>
      {Array.isArray(saveDetails.career) && saveDetails.career.length > 0 ? (
        <ul className="space-y-4">
          {saveDetails.career.map((stint: CareerStint, idx: number) =>  <CareerStintUI key={idx} careerStint={stint} />)}
        </ul>
      ) : (
        <div>No career stints found.</div>
      )}
    </div>
  );
}