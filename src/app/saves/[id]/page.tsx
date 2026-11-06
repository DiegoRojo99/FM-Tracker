'use client';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CareerStintsSection from './CareerStintSection';
import { SaveDetailsSkeleton } from './SaveDetailsSkeleton';
import TrophyCase from './TrophyCase';
import SeasonSection from './SeasonSection';
import ChallengeSection from './ChallengeSection';
import { FullDetailsSaveWithOwnership } from '@/lib/types/prisma/Save';
import { ArrowLeft, CalendarDays, Flag, Trophy } from 'lucide-react';

export default function SavePage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [saveDetails, setSaveDetails] = useState<FullDetailsSaveWithOwnership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      // Ensure we have an ID before proceeding
      if (!id) {
        console.error('No ID provided in URL parameters');
        notFound();
      }

      // Build headers with auth if available
      const headers: HeadersInit = {
        'cache': 'no-store'
      };
      
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/saves/${id}`, { 
        cache: 'no-store',
        headers,
      });
      
      if (!res.ok) {
        if (res.status === 404) notFound();
        return null;
      }

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

  if (loading || refresh) {
    return <SaveDetailsSkeleton />;
  }

  if (!saveDetails) notFound();

  const saveLabel = saveDetails.currentClub?.name || saveDetails.currentNT?.name || 'Unemployed Career';
  const stintsCount = saveDetails.careerStints?.length ?? 0;
  const seasonsCount = saveDetails.seasons?.length ?? 0;
  const trophiesCount = saveDetails.trophies?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <section className="fm-panel p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Link
              href="/saves"
              className="mb-3 inline-flex min-h-11 items-center gap-2 rounded text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Saves
            </Link>

            <h1 className="break-words text-3xl font-semibold text-[var(--color-foreground)]">{saveLabel}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {saveDetails.game?.name || 'FM Save'} | Current season {saveDetails.season}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2">
            <StatChip
              label="Stints"
              value={String(stintsCount)}
              subtitle="stops"
              icon={<Flag className="h-4 w-4" />}
            />
            <StatChip
              label="Seasons"
              value={String(seasonsCount)}
              subtitle="logged"
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <StatChip
              label="Trophies"
              value={String(trophiesCount)}
              subtitle="wins"
              icon={<Trophy className="h-4 w-4" />}
            />
          </div>
        </div>

      </section>

      <div className="mt-5 grid gap-5">
        <section id="stints" className="fm-panel p-4 sm:p-5">
          <CareerStintsSection saveDetails={saveDetails} setRefresh={setRefresh} />
        </section>

        <section id="seasons" className="fm-panel p-4 sm:p-5">
          <SeasonSection saveDetails={saveDetails} setRefresh={setRefresh} />
        </section>

        <section id="trophies" className="fm-panel p-4 sm:p-5">
          <TrophyCase save={saveDetails} setRefresh={setRefresh} />
        </section>

        <section id="challenges" className="fm-panel p-4 sm:p-5">
          <ChallengeSection challenges={saveDetails.challenges ?? []} />
        </section>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="fm-inset p-3">
      <div className="flex items-center gap-2 text-[var(--color-accent)]">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-start gap-1">
        <p className="font-mono text-xl font-semibold leading-none text-[var(--color-foreground)]">{value}</p>
        <p className="text-[12px] leading-none text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}
