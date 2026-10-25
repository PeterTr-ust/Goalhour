import { previousMonth } from '../lib/calendar';
import { formatDuration, formatSignedDuration } from '../lib/duration';
import type { MonthSummary } from '../lib/month';
import { formatMonthName, strings } from '../lib/strings';
import { GoalButton, GoalHeadline, SummaryRow } from './GoalOverview';
import { StatusBadge } from './StatusBadge';

interface MonthSummaryCardProps {
  summary: MonthSummary;
  onEditGoal: () => void;
}

export function MonthSummaryCard({ summary, onEditGoal }: MonthSummaryCardProps) {
  const { goal, total, close } = summary;

  return (
    <section aria-label={strings.month.total} className="rounded-3xl bg-surface p-5">
      {close && (
        <div className="mb-3">
          <StatusBadge closed size="large" />
        </div>
      )}

      <GoalHeadline
        caption={`${strings.month.total} (${close ? strings.month.final : strings.month.provisional})`}
        progressLabel={strings.month.progress}
        total={total}
        goal={goal}
      />

      <dl className="mt-5 divide-y divide-line text-base">
        <SummaryRow label={strings.month.entries} value={formatDuration(summary.entries)} />
        <SummaryRow
          label={strings.month.credits}
          value={formatDuration(summary.creditRaw)}
          detail={
            summary.creditCarryIn > 0
              ? {
                  label: strings.month.creditCarryIn(formatMonthName(previousMonth(summary.month))),
                  value: formatDuration(summary.creditCarryIn),
                }
              : undefined
          }
        />
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
        {close?.creditCarry ? (
          <SummaryRow
            label={strings.month.creditCarryOut}
            value={formatSignedDuration(-close.creditCarry)}
          />
        ) : null}
      </dl>

      <GoalButton
        label={strings.month.goal}
        goal={goal}
        setLabel={strings.month.setGoal}
        editLabel={strings.month.editGoal}
        onClick={onEditGoal}
      />
    </section>
  );
}
