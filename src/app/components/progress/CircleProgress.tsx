'use client';

type CircleProgressProps = {
  completed: number;
  total: number;
  size?: number; // default 80
  strokeWidth?: number; // default 8
};

export default function CircleProgress({
  completed,
  total,
  size = 80,
  strokeWidth = 8,
}: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="text-gray-200">
      {/* Background circle */}
      <circle
        className="stroke-current"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />

      {/* Progress circle */}
      <circle
        className="stroke-green-500"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />

      {/* Text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-sm"
      >
        {completed}/{total}
      </text>
    </svg>
  );
}
