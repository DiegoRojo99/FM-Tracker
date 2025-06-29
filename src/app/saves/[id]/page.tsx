'use client';
import { useAuth } from '@/app/components/AuthProvider';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SaveWithChildren } from '@/lib/types/Save';
import FootballLoader from '@/app/components/FootBallLoader';
import CareerStintsSection from './CareerStintSection';
import TrophyCase from './TrophyCase';
import SeasonSection from './SeasonSection';
import ChallengeSection from './ChallengeSection';

export default function SavePage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [saveDetails, setSaveDetails] = useState<SaveWithChildren | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);

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
      setSaveDetails(data);
      setLoading(false);
      setRefresh(false);
    };

    fetchData();
  }, [id, user, refresh]);

  if (loading || refresh) return <FootballLoader />;
  if (!saveDetails) notFound();

  console.log('Save details:', saveDetails);

  return (
    <div className="p-4 sm:p-6">
      <CareerStintsSection saveDetails={saveDetails} setRefresh={setRefresh} />
      <SeasonSection saveDetails={saveDetails} setRefresh={setRefresh} />
      <TrophyCase save={saveDetails} setRefresh={setRefresh} />
      <ChallengeSection challenges={saveDetails.challenges ?? []} />
    </div>
  );
}