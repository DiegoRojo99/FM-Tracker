'use client';

import { useState } from 'react';
import FootballLoader from '@/app/components/FootBallLoader';
import { useAuth } from '@/app/components/AuthProvider';
import { CompetitionGroup } from '@/lib/types/prisma/Competitions';
import { Team } from '@/lib/types/prisma/Team';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { Trophy } from '@/lib/types/prisma/Trophy';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';
import CompetitionWithWorldDropdown from '../dropdowns/CompetitionWithWorldDropdown';
import Image from 'next/image';
import { FullCareerStint } from '@/lib/types/prisma/Career';

type Props = {
  open: boolean;
  onClose: () => void;
  saveId: string;
  saveDetails: FullDetailsSave;
  onSuccess: (trophy: Trophy) => void;
};

export default function AddTrophyModal({ open, onClose, saveId, saveDetails, onSuccess }: Props) {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dateWon, setDateWon] = useState('');
  const [competition, setCompetition] = useState<CompetitionGroup | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTeam || !dateWon || !competition) return;
    setSaving(true);

    if (!user) return;
    const userToken = await user.getIdToken();

    await fetch(`/api/saves/${saveId}/trophies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        teamId: selectedTeam.id.toString(),
        dateWon: dateWon.toString(),
        competitionId: competition.id.toString(),
        countryCode: competition.countryCode.toString(),
      }),
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to add trophy');
      }
      return res.json();
    })
    .then((data) => {
      onSuccess(data);
    })
    .catch((error) => {
      console.error('Error adding trophy:', error);
      alert('Failed to add trophy. Please try again.');
    })
    .finally(() => {
      setSaving(false);
      onClose();
    });
  }

  if (!open) return <></>;;

  return (
    <BaseModal open={open} onClose={onClose} title="Add Trophy" maxWidth="max-w-md">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

        {/* Team */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Team</label>
          {saveDetails.careerStints && saveDetails.careerStints.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={(e) => {
                const teamId = e.target.value;
                if (teamId) {
                  const careerStint = saveDetails.careerStints?.find((stint: FullCareerStint) => stint.teamId === Number(teamId));
                  if (careerStint) {
                    setSelectedTeam(careerStint.team);
                    setCompetition(null);
                  }
                } else {
                  setSelectedTeam(null);
                  setCompetition(null);
                }
              }}
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Select a team</option>
              {Array.from(new Map(saveDetails.careerStints.map(stint => [stint.teamId, stint])).values()).map((stint) => (
                <option key={stint.teamId} value={stint.teamId}>{stint.team.name}</option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              No teams found. Add a career stint first.
            </p>
          )}
          {selectedTeam && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2">
              <Image src={selectedTeam.logo} alt={selectedTeam.name} width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
              <span className="text-sm font-semibold text-white">{selectedTeam.name}</span>
            </div>
          )}
        </div>

        {/* Competition */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Competition</label>
          {selectedTeam ? (
            <CompetitionWithWorldDropdown
              country={selectedTeam.countryCode}
              value={competition?.id ? String(competition.id) : ""}
              onChange={(comp: CompetitionGroup) => setCompetition(comp)}
              placeholder="Select competition"
            />
          ) : (
            <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              Select a team to choose a competition
            </p>
          )}
          {competition && (
            <p className="mt-1.5 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm font-semibold text-white">
              {competition.name}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Date Won</label>
          <input
            type="date"
            name="dateWon"
            value={dateWon}
            onChange={(e) => setDateWon(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            required
          />
        </div>

        <LoadingButton
          type="submit"
          width="full"
          size="lg"
          disabled={!selectedTeam || !competition || !dateWon}
          isLoading={saving}
          loadingText="Saving Trophy..."
        >
          Save Trophy
        </LoadingButton>
      </form>
    </BaseModal>
  );
}
