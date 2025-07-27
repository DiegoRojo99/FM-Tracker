'use client';

import { Trophy } from '@/lib/types/Trophy';
import { useState } from 'react';
import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import CompetitionSearchDropdown from '@/app/components/algolia/CompetitionSearchDropdown';
import FootballLoader from '@/app/components/FootBallLoader';
import { useAuth } from '@/app/components/AuthProvider';
import { Competition } from '@/lib/types/Country&Competition';
import { Team } from '@/lib/types/Team';
import BaseModal from './BaseModal';
import GradientButton from '../GradientButton';

type Props = {
  open: boolean;
  onClose: () => void;
  saveId: string;
  onSuccess: (trophy: Trophy) => void;
};

export default function AddTrophyModal({ open, onClose, saveId, onSuccess }: Props) {
  const { user } = useAuth();
  const [teamId, setTeamId] = useState('');
  const [dateWon, setDateWon] = useState('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!teamId || !dateWon || !competition) return;
    setLoading(true);

    if (!user) return;
    const userToken = await user.getIdToken();

    await fetch(`/api/saves/${saveId}/trophies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        teamId: teamId.toString(),
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
      onSuccess?.(data);
    })
    .catch((error) => {
      console.error('Error adding trophy:', error);
    })
    .finally(() => {
      setLoading(false);
      onClose();
    });
  }

  if (!open) return <></>;
  else if (loading) return <FootballLoader />;

  return (
    <BaseModal open={open} onClose={onClose} title="Add Trophy" maxWidth="max-w-md">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Competition</label>
          <CompetitionSearchDropdown
            onCompetitionSelect={(competition) => setCompetition(competition)}
          />
        </div>
        <div>
          <input
            hidden
            name="competitionId"
            value={competition ? competition.id : ''}
            readOnly
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white"
            placeholder="Enter competition ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Team</label>
          <TeamSearchDropdown
            onTeamSelect={(team: Team) => setTeamId(team.id.toString())}
          />
        </div>
        <div>
          <input
            hidden
            name="teamId"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white"
            placeholder="Enter team ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Won Date</label>
          <input
            type="date"
            name="dateWon"
            value={dateWon}
            onChange={(e) => setDateWon(e.target.value)}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            required
          />
        </div>

        <GradientButton
          type="submit"
          width="full"
          size="lg"
        >
          Save Trophy
        </GradientButton>
      </form>
    </BaseModal>
  )
}
