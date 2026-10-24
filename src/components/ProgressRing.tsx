import { strings } from '../lib/strings';

const SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PERCENT = 100;

interface ProgressRingProps {
  /** Shown progress between 0 and 1 (may be mid-animation). */
  progress: number;
  /** Progress the ring is heading to, announced to assistive technology. */
  targetProgress: number;
  /** Plays a short pulse while true. */
  celebrate: boolean;
}

export function ProgressRing({ progress, targetProgress, celebrate }: ProgressRingProps) {
  const percent = Math.round(progress * PERCENT);
  const targetPercent = Math.round(targetProgress * PERCENT);
  const center = SIZE / 2;

  return (
    <div
      role="progressbar"
      aria-label={strings.month.progress}
      aria-valuemin={0}
      aria-valuemax={PERCENT}
      aria-valuenow={targetPercent}
      aria-valuetext={`${targetPercent} %`}
      className={`relative size-28 shrink-0 ${celebrate ? 'animate-celebrate' : ''}`}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-line"
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
          className={`stroke-fg ${progress === 0 ? 'opacity-0' : ''}`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums"
        aria-hidden="true"
      >
        {percent} %
      </span>
    </div>
  );
}
