interface PrimarySaveCardProps {
  save: any;
}

export default function PrimarySaveCard({ save }: PrimarySaveCardProps) {
  // For now, just display some basic info
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 max-w-2xl mx-auto bg-[var(--color-darker)] rounded-xl shadow-lg p-8 text-center">
      <div className="text-5xl mb-4">⚽</div>
      <h3 className="text-xl font-bold text-white mb-2">{save?.name || 'Primary Save'}</h3>
      <p className="text-gray-300 mb-2">Club: {save?.clubName || 'Unknown Club'}</p>
      <p className="text-gray-400">Seasons: {save?.seasons || 0}</p>
    </div>
  );
}