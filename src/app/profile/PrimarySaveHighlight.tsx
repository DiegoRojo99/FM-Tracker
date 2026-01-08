import { useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

export default function PrimarySaveHighlight() {
  const { user } = useAuth();

  useEffect(() => {
    const fetchPrimarySave = async () => {
      if (!user) return;
      try {
        const userToken = await user.getIdToken();
        const response = await fetch(`/api/users/${user.uid}/primary-save`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch primary save');
        const data = await response.json();

        // Log the result for now
        console.log('Primary save:', data);
      } 
      catch (err) {
        console.error('Error fetching primary save:', err);
      }
    };
    
    fetchPrimarySave();
  }, [user]);

  return null;
}