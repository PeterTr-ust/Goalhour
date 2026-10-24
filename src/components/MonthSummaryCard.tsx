import { formatDuration, formatSignedDuration } from '../lib/duration';
import { goalProgress, goalStatus, type GoalStatus } from '../lib/goal';
import type { MonthSummary } from '../lib/month';
import { strings } from '../lib/strings';
import { ProgressRing } from './ProgressRing';

const PERCENT = 100;

interface MonthSummaryCardProps {
  summary: MonthSummary;
  onEditGoal: () => void;
}

export function MonthSummaryCard({ summary, onEditGoal }: MonthSummaryCardProps) {
  const { goal, total, close } = summary;
  const progress = goalProgress(goal, total);
  const status = goalStatus(goal, total);

  return (
    <section
      aria-label={strings.month.total}
      className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900"
    >
      {close && (
        <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900 dark:bg-teal-900 dark:text-teal-100">
          <span aria-hidden="true">✓</span>
          {strings.month.closed}
        </p>
      )}

      <div className="flex items-center gap-5">
        <ProgressRing progress={progress} label={`${Math.round(progress * PERCENT)} %`} />
        <div className="min-w-0">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {strings.month.total} ({close ? strings.month.final : strings.month.provisional})
          </p>
          <p className="text-5xl font-bold tracking-tight tabular-nums">{formatDuration(total)}</p>
          <GoalStatusLine status={status} />
        </div>
      </div>

      <dl className="mt-5 divide-y divide-slate-200 text-base dark:divide-slate-800">
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
        className="mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-slate-100 px-4 text-left active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700"
      >
        <span className="font-medium">{strings.month.goal}</span>
        <span className="text-lg font-semibold tabular-nums text-teal-700 dark:text-teal-400">
          {goal === undefined ? strings.month.setGoal : formatDuration(goal)}
        </span>
      </button>
    </section>
  );
}

function GoalStatusLine({ status }: { status: GoalStatus }) {
  switch (status.kind) {
    case 'noGoal':
      return <p className="text-sm text-slate-600 dark:text-slate-400">{strings.month.noGoal}</p>;
    case 'missing':
      return (
        <p className="text-base">
          {strings.month.missing}{' '}
          <strong className="tabular-nums">{formatDuration(status.minutes)}</strong>
        </p>
      );
    case 'reached':
      return (
        <p className="text-base font-semibold text-teal-700 dark:text-teal-400">
          {strings.month.reached}
        </p>
      );
    case 'exceeded':
      return (
        <p className="text-base font-semibold text-teal-700 dark:text-teal-400">
          {strings.month.exceeded}{' '}
          <span className="tabular-nums">{formatSignedDuration(status.minutes)}</span>
        </p>
      );
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
