import { useState } from 'react';
import type { Save } from '@/lib/types/Save';

const STATUS_OPTIONS = [
  { value: 'current', label: '⚡ Current', color: 'green' },
  { value: 'paused', label: '⏸️ Paused', color: 'yellow' },
  { value: 'completed', label: '✅ Completed', color: 'blue' },
  { value: 'inactive', label: '📁 Inactive', color: 'gray' },
];

type SaveStatus = 'current' | 'paused' | 'completed' | 'inactive';

interface SaveStatusModalProps {
  open: boolean;
  save: Save;
  onClose: () => void;
  onSubmit: (status: SaveStatus, isPrimary: boolean) => void;
}

export default function SaveStatusModal({ open, save, onClose, onSubmit }: SaveStatusModalProps) {
  const [status, setStatus] = useState<SaveStatus>(save.status || 'current');
  const [isPrimary, setIsPrimary] = useState<boolean>(!!save.isPrimary);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:w-[400px] bg-[var(--color-dark)] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <h2 className="text-xl font-bold mb-4 text-center">Edit Save Status</h2>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`px-4 py-2 rounded-lg font-medium border-2 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${opt.color}-400 ${
                  status === opt.value
                    ? `bg-${opt.color}-100 border-${opt.color}-500 text-${opt.color}-900`
                    : `bg-gray-800 border-gray-600 text-gray-200 hover:bg-${opt.color}-100 hover:text-${opt.color}-900`
                }`}
                onClick={() => setStatus(opt.value as SaveStatus)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {status === 'current' && (
            <label className="flex items-center gap-2 justify-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={e => setIsPrimary(e.target.checked)}
                className="form-checkbox h-5 w-5 text-yellow-500"
              />
              <span className="text-yellow-400 font-medium">Set as Primary Save</span>
            </label>
          )}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            className="px-6 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-dark)] transition-colors"
            onClick={() => { setSubmitting(true); onSubmit(status, isPrimary); }}
            disabled={submitting}
          >
            Save
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
