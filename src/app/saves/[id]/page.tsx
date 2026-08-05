'use client';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FootballLoader from '@/app/components/FootBallLoader';
import CareerStintsSection from './CareerStintSection';
import TrophyCase from './TrophyCase';
import SeasonSection from './SeasonSection';
import ChallengeSection from './ChallengeSection';
import { FullDetailsSaveWithOwnership } from '@/lib/types/prisma/Save';
import { ArrowLeft, CalendarDays, Flag, Shield, Trophy } from 'lucide-react';

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
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[52vh] items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!saveDetails) notFound();

  const saveLabel = saveDetails.currentClub?.name || saveDetails.currentNT?.name || 'Unemployed Career';
  const stintsCount = saveDetails.careerStints?.length ?? 0;
  const seasonsCount = saveDetails.seasons?.length ?? 0;
  const trophiesCount = saveDetails.trophies?.length ?? 0;
  const activeChallengesCount = saveDetails.challenges?.length ?? 0;
  const completedChallengeCount = (saveDetails.challenges ?? []).filter((challenge) => Boolean(challenge.completedAt)).length;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[-3rem] h-40 w-40 rounded-full bg-[var(--color-highlight)]/15 blur-3xl" />
          <div className="absolute right-[8%] top-[10%] h-48 w-48 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/saves"
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)] transition hover:opacity-90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Saves
            </Link>

            <h1 className="text-3xl font-black text-white sm:text-4xl">{saveLabel}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {saveDetails.game?.name || 'FM Save'} | Current season {saveDetails.season}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
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
            <StatChip
              label="Challenges"
              value={`${completedChallengeCount}/${activeChallengesCount}`}
              subtitle="done/active"
              icon={<Shield className="h-4 w-4" />}
            />
          </div>
        </div>

      </section>

      <div className="mt-6 grid gap-6">
        <section id="stints" className="min-w-0 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
          <CareerStintsSection saveDetails={saveDetails} setRefresh={setRefresh} />
        </section>

        <section id="seasons" className="min-w-0 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
          <SeasonSection saveDetails={saveDetails} setRefresh={setRefresh} />
        </section>

        <section id="trophies" className="min-w-0 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
          <TrophyCase save={saveDetails} setRefresh={setRefresh} />
        </section>

        <section id="challenges" className="min-w-0 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
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
    <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-3">
      <div className="flex items-center gap-2 text-[var(--color-highlight)]">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      </div>
      <div className="mt-4 flex items-baseline justify-start gap-2">
        <p className="text-xl font-black leading-none text-white">{value}</p>
        <p className="text-[12px] leading-none text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}
