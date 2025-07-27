import { Competition } from '@/lib/types/Country&Competition';
import React, { useEffect, useState } from 'react';

interface CompetitionWithWorldDropdownProps {
  country: string;
  type?: string;
  value?: string;
  onChange?: (competition: Competition) => void;
  placeholder?: string;
}

const CompetitionWithWorldDropdown: React.FC<CompetitionWithWorldDropdownProps> = ({
  country,
  type,
  value,
  onChange,
  placeholder = 'Select competition',
}) => {
  const [nationalCompetitions, setNationalCompetitions] = useState<Competition[]>([]);
  const [worldCompetitions, setWorldCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      try {
        // Fetch national competitions
        const nationalParams = new URLSearchParams();
        nationalParams.append('country', country);
        if (type) nationalParams.append('type', type);

        const nationalRes = await fetch(`/api/competitions?${nationalParams.toString()}`);
        const nationalData = await nationalRes.json();

        // Fetch world competitions
        const worldParams = new URLSearchParams();
        worldParams.append('country', 'WOR');
        if (type) worldParams.append('type', type);

        const worldRes = await fetch(`/api/competitions?${worldParams.toString()}`);
        const worldData = await worldRes.json();

        setNationalCompetitions(nationalData);
        setWorldCompetitions(worldData);
      } catch (error) {
        console.error('Error fetching competitions:', error);
        setNationalCompetitions([]);
        setWorldCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [country, type]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    if (!selectedId) return;
    
    // Look in both national and world competitions
    const selectedComp = [...nationalCompetitions, ...worldCompetitions].find(
      comp => comp.id === selectedId
    );
    
    if (selectedComp) {
      onChange?.(selectedComp);
    }
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={loading}
      className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="" className="bg-[var(--color-darker)] text-white">
        {loading ? 'Loading...' : placeholder}
      </option>
      
      {/* National Competitions */}
      {nationalCompetitions.length > 0 && (
        <optgroup label="National Competitions" className="bg-[var(--color-darker)] text-white font-semibold">
          {nationalCompetitions.map(comp => (
            <option key={comp.id} value={comp.id} className="bg-[var(--color-darker)] text-white pl-4">
              {comp.name}
            </option>
          ))}
        </optgroup>
      )}
      
      {/* International Competitions */}
      {worldCompetitions.length > 0 && (
        <optgroup label="International Competitions" className="bg-[var(--color-darker)] text-white font-semibold">
          {worldCompetitions.map(comp => (
            <option key={comp.id} value={comp.id} className="bg-[var(--color-darker)] text-white pl-4">
              {comp.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
};

export default CompetitionWithWorldDropdown;
