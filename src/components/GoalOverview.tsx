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

interface SummaryRowProps {
  label: string;
  value: string;
  strong?: boolean;
  /** Smaller second line that details the row (e.g. "davon Übertrag …"). */
  detail?: { label: string; value: string } | undefined;
  /** Small dot that ties the row to hours (filled) or credits (outlined). */
  marker?: SummaryMarker;
}

type SummaryMarker = 'hours' | 'credits';

const MARKER_CLASSES: Record<SummaryMarker, string> = {
  hours: 'bg-fg',
  credits: 'border-2 border-fg',
};

export function SummaryRow({ label, value, strong = false, detail, marker }: SummaryRowProps) {
  return (
    <div className="py-2">
      <div className="flex justify-between">
        <dt className={`flex items-center gap-2.5 ${strong ? 'font-semibold' : 'text-muted'}`}>
          {marker && (
            <span
              aria-hidden="true"
              className={`size-2.5 shrink-0 rounded-full ${MARKER_CLASSES[marker]}`}
            />
          )}
          {label}
        </dt>
        <dd className={`tabular-nums ${strong ? 'font-bold' : 'font-medium'}`}>{value}</dd>
      </div>
      {detail && (
        <div className={`flex justify-between text-sm text-muted ${marker ? 'pl-9' : 'pl-4'}`}>
          <dt>{detail.label}</dt>
          <dd className="tabular-nums">{detail.value}</dd>
        </div>
      )}
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
