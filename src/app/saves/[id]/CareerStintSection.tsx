'use client';

import { useState } from 'react';
import { FullCareerStint } from '@/lib/types/prisma/Career';
import CareerTimeline from './CareerTimeline';
import AddCareerStintModal from '@/app/components/modals/AddCareerStintModal';
import GradientButton from '@/app/components/GradientButton';
import { useAuth } from '@/app/components/AuthProvider';
import { FullDetailsSaveWithOwnership } from '@/lib/types/prisma/Save';
import { BriefcaseBusiness } from 'lucide-react';

type Props = {
  saveDetails: FullDetailsSaveWithOwnership;
  setRefresh: (refresh: boolean) => void; // Optional prop for refreshing
};

export default function CareerStintsSection({ saveDetails, setRefresh }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStint, setEditingStint] = useState<FullCareerStint | null>(null);

  const handleSuccess = () => {
    setRefresh(true);
    setEditingStint(null);
  };

  const onUpdateStint = (stint: FullCareerStint) => {
    setEditingStint(stint);
    setIsOpen(true);
  };

  const onDeleteStint = async (stintId: number) => {
    try {
      if (!user) {
        console.error('User is not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/saves/${saveDetails.id}/career/${stintId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete career stint');
      }

      setRefresh(true);
    } catch (error) {
      console.error('Error deleting career stint:', error);
      alert('Failed to delete career stint. Please try again.');
    }
  };

  return (
    <section className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Career History
          </p>
          <h3 className="mt-1 text-xl font-black text-white">Career Stints</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Track each role change through your journey timeline.</p>
        </div>

        {saveDetails.isOwner && (
          <GradientButton onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
            + Add Stint
          </GradientButton>
        )}
      </div>

      {saveDetails.careerStints?.length ? (
        <CareerTimeline
          saveDetails={saveDetails}
          onUpdateStint={onUpdateStint}
          onDeleteStint={onDeleteStint}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No career stints found yet.</p>
          {saveDetails.isOwner && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-3 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-dark)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-highlight)]"
            >
              Add your first stint
            </button>
          )}
        </div>
      )}

      <AddCareerStintModal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingStint(null);
        }}
        saveDetails={saveDetails}
        onSuccess={handleSuccess}
        editingStint={editingStint}
      />
    </section>
  );
}
