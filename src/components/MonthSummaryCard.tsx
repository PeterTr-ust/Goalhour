import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatDuration, formatSignedDuration } from '../lib/duration';
import { goalProgress, goalStatus, type GoalStatus } from '../lib/goal';
import type { MonthSummary } from '../lib/month';
import { strings } from '../lib/strings';
import { ProgressRing } from './ProgressRing';

interface MonthSummaryCardProps {
  summary: MonthSummary;
  onEditGoal: () => void;
}

/** Formats an animated (fractional) minute value. */
function formatAnimated(minutes: number): string {
  return formatDuration(Math.round(minutes));
}

export function MonthSummaryCard({ summary, onEditGoal }: MonthSummaryCardProps) {
  const { goal, total, close } = summary;
  const progress = goalProgress(goal, total);
  const status = goalStatus(goal, total);
  const shownTotal = useAnimatedNumber(total);
  const shownProgress = useAnimatedNumber(progress);
  const goalMet = status.kind === 'reached' || status.kind === 'exceeded';

  return (
    <section aria-label={strings.month.total} className="rounded-3xl bg-surface p-5">
      {close && (
        <p className="mb-3 inline-flex animate-pop-in items-center gap-1 rounded-full bg-fg px-3 py-1 text-sm font-semibold text-bg">
          <span aria-hidden="true">✓</span>
          {strings.month.closed}
        </p>
      )}

      <div className="flex items-center gap-4">
        <ProgressRing progress={shownProgress} targetProgress={progress} celebrate={goalMet} />
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {strings.month.total} ({close ? strings.month.final : strings.month.provisional})
          </p>
          <p
            className="text-[clamp(2.25rem,12vw,3rem)] leading-tight font-bold tracking-tight tabular-nums"
            aria-label={formatDuration(total)}
          >
            {formatAnimated(shownTotal)}
          </p>
          <GoalStatusLine status={status} />
        </div>
      </div>

      <dl className="mt-5 divide-y divide-line text-base">
        <SummaryRow label={strings.month.entries} value={formatDuration(summary.entries)} />
        <SummaryRow label={strings.month.credits} value={formatDuration(summary.credits)} />
        {summary.carryIn > 0 && (
          <SummaryRow label={strings.month.carryIn} value={formatDuration(summary.carryIn)} />
        )}
        {close?.mode === 'roundUp' && (
          <SummaryRow
            label={strings.itemTypes.roundUp}
            value={formatSignedDuration(close.adjustment)}
          />
        )}
        {close?.mode === 'carryOver' && (
          <SummaryRow
            label={strings.itemTypes.carryOut}
            value={formatSignedDuration(-close.adjustment)}
          />
        )}
      </dl>

      <button
        type="button"
        onClick={onEditGoal}
        aria-label={
          goal === undefined ? strings.month.setGoal : strings.month.editGoal(formatDuration(goal))
        }
        className="mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-bg px-4 text-left transition-transform duration-150 active:scale-[0.98]"
      >
        <span className="font-medium">{strings.month.goal}</span>
        <span className="text-lg font-semibold tabular-nums">
          {goal === undefined ? strings.month.setGoal : formatDuration(goal)}
          <span aria-hidden="true" className="ml-2 text-muted">
            ›
          </span>
        </span>
      </button>
    </section>
  );
}

function AnimatedDuration({ minutes, signed = false }: { minutes: number; signed?: boolean }) {
  const shown = Math.round(useAnimatedNumber(minutes));
  return <>{signed ? formatSignedDuration(shown) : formatDuration(shown)}</>;
}

function GoalStatusLine({ status }: { status: GoalStatus }) {
  switch (status.kind) {
    case 'noGoal':
      return <p className="text-sm text-muted">{strings.month.noGoal}</p>;
    case 'missing':
      return (
        <p className="text-base text-muted">
          {strings.month.missing}{' '}
          <strong className="font-semibold text-fg tabular-nums">
            <AnimatedDuration minutes={status.minutes} />
          </strong>
        </p>
      );
    case 'reached':
      return (
        <p className="animate-fade-up text-base font-semibold">
          <span aria-hidden="true">✓ </span>
          {strings.month.reached}
        </p>
      );
    case 'exceeded':
      return (
        <p className="animate-fade-up text-base font-semibold">
          {strings.month.exceeded}{' '}
          <span className="tabular-nums">
            <AnimatedDuration minutes={status.minutes} signed />
          </span>
        </p>
      );
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
