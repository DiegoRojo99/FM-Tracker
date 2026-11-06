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
        <div className="text-sm text-[var(--color-text-muted)] text-right">
          {completed}/{total}
        </div>
      )}

      <div
        className={`bg-[var(--color-surface-strong)] border-[var(--color-surface-border)] w-full border overflow-hidden ${
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
