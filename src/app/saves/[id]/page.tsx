'use client';
import { useAuth } from '@/app/components/AuthProvider';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SaveWithChildren } from '@/lib/types/Save';
import FootballLoader from '@/app/components/FootBallLoader';
import CareerStintsSection from './CareerStintSection';
import TrophyCase from './TrophyCase';

export default function SavePage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [saveDetails, setSaveDetails] = useState<SaveWithChildren | null>(null);
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
      setSaveDetails(data);
      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  if (loading) return <FootballLoader />;
  if (!saveDetails) notFound();

  return (
    <div className="p-4 sm:p-6">
      <CareerStintsSection saveDetails={saveDetails} />
      <TrophyCase save={saveDetails} />
    </div>
  );
}