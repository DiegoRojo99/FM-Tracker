import { FirebaseCompetition } from '@/lib/types/Country&Competition';
import React, { useEffect, useState } from 'react';

interface CompetitionDropdownProps {
  country?: string;
  type?: string;
  value?: string;
  onChange?: (competition: FirebaseCompetition) => void;
  placeholder?: string;
}

const CompetitionDropdown: React.FC<CompetitionDropdownProps> = ({
  country,
  type,
  value,
  onChange,
  placeholder = 'Select competition',
}) => {
  const [competitions, setCompetitions] = useState<FirebaseCompetition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (country) params.append('country', country);
        if (type) params.append('type', type);

        const res = await fetch(`/api/competitions?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch competitions');
        const data = await res.json();
        setCompetitions(data);
      } catch {
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, [country, type]);

  return (
    <select
      value={value || ''}
      onChange={e => {
        const selectedComp = competitions.find(comp => comp.id === Number(e.target.value));
        if (!selectedComp) return;
        onChange?.(selectedComp);
      }}
      disabled={loading}
      className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="" className="bg-[var(--color-darker)] text-white">{loading ? 'Loading...' : placeholder}</option>
      {competitions.map(comp => (
        <option key={comp.id} value={comp.id} className="bg-[var(--color-darker)] text-white">
          {comp.name}
        </option>
      ))}
    </select>
  );
};

export default CompetitionDropdown;