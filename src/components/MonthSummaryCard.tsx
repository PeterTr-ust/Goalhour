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

/** "davon Übertrag aus Oktober 0:30", or nothing when nothing was carried in. */
function carryInDetail(minutes: number, fromMonth: string) {
  return minutes > 0
    ? { label: strings.month.carryInDetail(fromMonth), value: formatDuration(minutes) }
    : undefined;
}

export function MonthSummaryCard({ summary, onEditGoal }: MonthSummaryCardProps) {
  const { goal, total, close } = summary;
  const previousMonthName = formatMonthName(previousMonth(summary.month));

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
        {/*
          Carry-ins are shown the same way for both parts: as a note under the sum. Rows about
          hours carry a filled dot, rows about credits an outlined one, like in the list.
        */}
        <SummaryRow
          label={strings.month.entries}
          marker="hours"
          value={formatDuration(summary.entryRaw)}
          detail={carryInDetail(summary.carryIn, previousMonthName)}
        />
        <SummaryRow
          label={strings.month.credits}
          marker="credits"
          value={formatDuration(summary.creditRaw)}
          detail={carryInDetail(summary.creditCarryIn, previousMonthName)}
        />
        {close?.mode === 'roundUp' && (
          <SummaryRow
            label={strings.itemTypes.roundUp}
            marker="hours"
            value={formatSignedDuration(close.adjustment)}
          />
        )}
        {close?.mode === 'carryOver' && (
          <SummaryRow
            label={strings.itemTypes.carryOut}
            marker="hours"
            value={formatSignedDuration(-close.adjustment)}
          />
        )}
        {close?.creditRoundUp ? (
          <SummaryRow
            label={strings.itemTypes.creditRoundUp}
            marker="credits"
            value={formatSignedDuration(close.creditRoundUp)}
          />
        ) : null}
        {close?.creditCarry ? (
          <SummaryRow
            label={strings.itemTypes.creditCarry}
            marker="credits"
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
