'use client';

import { FullCareerStint } from '@/lib/types/prisma/Career';
import { FullDetailsSaveWithOwnership } from '@/lib/types/prisma/Save';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';

type Props = {
  saveDetails: FullDetailsSaveWithOwnership;
  onUpdateStint?: (stint: FullCareerStint) => void;
  onDeleteStint?: (stintId: number) => void;
};

function groupStintsByStart(stints: FullCareerStint[]) {
  const grouped: Record<string, FullCareerStint[]> = {};

  stints.forEach((stint) => {
    const key = stint.startDate.toString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(stint);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([startDate, entries]) => ({
      startDate,
      entries,
    }));
}

function formatDate(datePassed: string): string {
  const date = new Date(datePassed);
  const month = date.toLocaleString(undefined, { month: 'long' });
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalizedMonth} ${date.getFullYear()}`;
}

export default function CareerTimeline({ saveDetails, onUpdateStint, onDeleteStint }: Props) {
  const grouped = groupStintsByStart(saveDetails.careerStints).reverse();

  return (
    <div className="relative py-2">
      <div className="absolute bottom-2 left-3 top-2 w-px bg-[var(--color-surface-border)] sm:left-4" />

      <div className="space-y-6">
        {grouped.map(({ startDate, entries }, idx) => (
          <div key={idx} className="relative pl-8 sm:pl-10">
            <span className="absolute left-0 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-surface-border)] bg-[var(--color-dark)] text-[10px] font-semibold text-[var(--color-highlight)] sm:h-8 sm:w-8">
              {idx + 1}
            </span>

            <div className="mb-3 inline-flex rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Started {formatDate(startDate)}
            </div>

            <div className={`grid grid-cols-1 gap-3 ${entries.length > 1 ? 'xl:grid-cols-2' : ''}`}>
              {entries.map((stint, sIdx) => (
                <CareerStintCard
                  key={sIdx}
                  stint={stint}
                  onUpdate={onUpdateStint}
                  onDelete={onDeleteStint}
                  isOwner={saveDetails.isOwner}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function CareerStintCard({ 
  stint, 
  onUpdate, 
  onDelete,
  isOwner = false
}: { 
  stint: FullCareerStint;
  onUpdate?: (stint: FullCareerStint) => void;
  onDelete?: (stintId: number) => void;
  isOwner?: boolean;
}) {
  const handleDelete = () => {
    if (!stint.id) return;
    const deleteConfirmed = window.confirm(`Are you sure you want to delete the career stint at ${stint.team?.name}?`);
    if (deleteConfirmed) {
      onDelete?.(stint.id);
    }
  };

  const handleUpdate = () => {
    if (!stint.id) return;
    onUpdate?.(stint);
  };

  return (
    <article className="relative rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-4 shadow-lg backdrop-blur-sm">
      {/* Action buttons */}
      {isOwner && (onUpdate || onDelete) && (
        <div className="absolute right-3 top-3 flex gap-1">
          {onUpdate && (
            <button
              onClick={handleUpdate}
              className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-1.5 text-[var(--color-text-muted)] transition hover:text-white"
              title="Edit career stint"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-1.5 text-red-300 transition hover:text-red-200"
              title="Delete career stint"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 pr-16">
        {stint.team && stint.team.logo && (
          <Image
            width={72}
            height={72}
            src={stint.team.logo}
            alt={stint.team.name}
            className="h-14 w-14 flex-none object-contain sm:h-16 sm:w-16"
          />
        )}

        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-white">{stint.team?.name}</h4>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {formatDate(stint.startDate)} - {stint.endDate ? formatDate(stint.endDate) : 'Present'}
          </p>
          <div className="mt-2 inline-flex rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {stint.isNational ? 'National Team' : 'Club'}
          </div>
        </div>
      </div>
    </article>
  );
}