import { useState } from 'react';
import type { Save } from '@/lib/types/Save';
import { useAuth } from '../components/AuthProvider';

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
  const { user } = useAuth();
  const [status, setStatus] = useState<SaveStatus>(save.status || 'current');
  const [isPrimary, setIsPrimary] = useState<boolean>(!!save.isPrimary);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/saves/${save.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, isPrimary }),
      });
      if (!res.ok) throw new Error('Failed to update save');

      const updated = await res.json();
      onSubmit(updated.status, updated.isPrimary);
    } 
    catch (e) {
      setError('Failed to update save. Please try again.');
    } 
    finally {
      setSubmitting(false);
    }
  }

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
                className={`px-4 py-2 rounded-lg font-medium border-2 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${status === opt.value
                    ? `bg-${opt.color}-100 border-${opt.color}-500 text-gray-900 shadow-md`
                    : `bg-gray-100 border-gray-300 text-gray-700 hover:bg-${opt.color}-100 hover:text-gray-900`}
                `}
                style={status === opt.value ? { fontWeight: 700 } : {}}
                onClick={() => setStatus(opt.value as SaveStatus)}
                type="button"
                disabled={submitting}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {status === 'current' && (
            <button
              type="button"
              onClick={() => setIsPrimary(!isPrimary)}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 transition-all text-base font-semibold mt-2
                ${isPrimary
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
                  : 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'}
              `}
              aria-pressed={isPrimary}
              disabled={submitting}
            >
              <span className="inline-block w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center bg-white">
                {isPrimary ? (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="text-blue-600"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                ) : null}
              </span>
              {isPrimary ? 'Primary Save (Selected)' : 'Set as Primary Save'}
            </button>
          )}
          {error && <div className="text-red-400 text-sm text-center mt-2">{error}</div>}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            className="px-6 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-dark)] transition-colors"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
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
