import { strings } from '../lib/strings';

const SIZE = 120;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PERCENT = 100;

interface ProgressRingProps {
  /** Progress between 0 and 1. */
  progress: number;
  label: string;
}

export function ProgressRing({ progress, label }: ProgressRingProps) {
  const percent = Math.round(progress * PERCENT);
  const center = SIZE / 2;

  return (
    <div
      role="progressbar"
      aria-label={strings.month.progress}
      aria-valuemin={0}
      aria-valuemax={PERCENT}
      aria-valuenow={percent}
      aria-valuetext={`${percent} %`}
      className="relative size-30 shrink-0"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className="stroke-teal-600 transition-[stroke-dashoffset] duration-500 dark:stroke-teal-400"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums"
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
}
