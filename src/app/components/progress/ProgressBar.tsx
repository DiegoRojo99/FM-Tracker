'use client';

type ProgressBarProps = {
  completed: number;
  total: number;
  showText?: boolean;
  height?: number; // in pixels, default 12
  rounded?: boolean;
};

export default function ProgressBar({
  completed,
  total,
  showText = true,
  height = 12,
  rounded = true,
}: ProgressBarProps) {
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;

  return (
    <div className="w-full space-y-1">
      {showText && (
        <div className="text-sm text-gray-600 dark:text-gray-300 text-right">
          {completed}/{total}
        </div>
      )}

      <div
        className={`bg-gray-200 dark:bg-zinc-800 w-full border overflow-hidden ${
          rounded ? 'rounded-full' : ''
        }`}
        style={{ height }}
      >
        <div
          className="bg-green-500 h-full transition-all duration-300"
          style={{
            width: `${progress * 100}%`,
            borderRadius: rounded ? '9999px' : undefined,
          }}
        />
      </div>
    </div>
  );
}
