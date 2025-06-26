import { CUP_ROUNDS } from '@/lib/types/Season';
import React from 'react';

interface CupRoundDropdownProps {
  value?: string;
  onChange?: (cupRoundId: string) => void;
}

const CupRoundDropdown: React.FC<CupRoundDropdownProps> = ({
  value,
  onChange,
}) => {

  return (
    <select
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
    >
      <option value="">Select cup round</option>
      {CUP_ROUNDS.map(comp => (
        <option key={comp} value={comp}>
          {comp}
        </option>
      ))}
    </select>
  );
};

export default CupRoundDropdown;