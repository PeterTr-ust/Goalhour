import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatDuration } from '../lib/duration';
import { goalProgress, goalStatus, goalTone } from '../lib/goal';
import { GoalStatusLine } from './GoalStatusLine';
import { ProgressRing } from './ProgressRing';

interface GoalHeadlineProps {
  /** Small label above the total, e.g. "Gesamt (vorläufig)". */
  caption: string;
  progressLabel: string;
  total: number;
  goal: number | undefined;
}

/** Progress ring, large animated total and the goal status line. */
export function GoalHeadline({ caption, progressLabel, total, goal }: GoalHeadlineProps) {
  const progress = goalProgress(goal, total);
  const status = goalStatus(goal, total);
  const shownTotal = Math.round(useAnimatedNumber(total));
  const shownProgress = useAnimatedNumber(progress);

  return (
    <div className="flex items-center gap-4">
      <ProgressRing
        label={progressLabel}
        progress={shownProgress}
        targetProgress={progress}
        tone={goalTone(status)}
      />
      <div className="min-w-0">
        <p className="text-sm text-muted">{caption}</p>
        <p
          className="text-[clamp(2.25rem,12vw,3rem)] leading-tight font-bold tracking-tight tabular-nums"
          aria-label={formatDuration(total)}
        >
          {formatDuration(shownTotal)}
        </p>
        <GoalStatusLine status={status} />
      </div>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between py-2">
      <dt className={strong ? 'font-semibold' : 'text-muted'}>{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-bold' : 'font-medium'}`}>{value}</dd>
    </div>
  );
}

interface GoalButtonProps {
  label: string;
  goal: number | undefined;
  setLabel: string;
  editLabel: (value: string) => string;
  onClick: () => void;
}

export function GoalButton({ label, goal, setLabel, editLabel, onClick }: GoalButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={goal === undefined ? setLabel : editLabel(formatDuration(goal))}
      className="mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-bg px-4 text-left transition-transform duration-150 active:scale-[0.98]"
    >
      <span className="font-medium">{label}</span>
      <span className="text-lg font-semibold tabular-nums">
        {goal === undefined ? setLabel : formatDuration(goal)}
        <span aria-hidden="true" className="ml-2 text-muted">
          ›
        </span>
      </span>
    </button>
  );
}
