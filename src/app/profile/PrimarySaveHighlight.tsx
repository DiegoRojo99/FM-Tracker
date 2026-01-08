import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import NoPrimarySave from './primary-save/NoPrimarySave';
import PrimarySaveCard from './primary-save/PrimarySaveCard';

export default function PrimarySaveHighlight() {
  const { user } = useAuth();
  const [primarySave, setPrimarySave] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    const fetchPrimarySave = async () => {
      if (!user) return setPrimarySave(null);
      try {
        const userToken = await user.getIdToken();
        const response = await fetch(`/api/users/${user.uid}/primary-save`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch primary save');
        const data = await response.json();
        setPrimarySave(data);
      } 
      catch (err) {
        setPrimarySave(null);
        console.error('Error fetching primary save:', err);
      }
    };
    fetchPrimarySave();
  }, [user]);

  // Always reserve the same space for the highlight section
  if (primarySave === undefined) return <PrimarySaveSkeleton />;
  else if (!primarySave) return <NoPrimarySave />;
  else return <PrimarySaveCard save={primarySave} />;
}

function PrimarySaveSkeleton() {
  return (
    <div className="w-full h-64 max-w-2xl mx-auto animate-pulse bg-[var(--color-darker)] rounded-lg" />
  );
}