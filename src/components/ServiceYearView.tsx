import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatDuration, formatSignedDuration } from '../lib/duration';
import { goalProgress } from '../lib/goal';
import type { MonthData, MonthSummary } from '../lib/month';
import { goalDifference, summarizeServiceYear } from '../lib/serviceYear';
import { formatMonth, formatMonthName, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { PeriodNavigator } from './PeriodNavigator';

const STAGGER_MS = 30;

interface ServiceYearViewProps {
  startYear: number;
  data: MonthData;
  onYearChange: (startYear: number) => void;
  onOpenMonth: (month: MonthKey) => void;
}

export function ServiceYearView({
  startYear,
  data,
  onYearChange,
  onOpenMonth,
}: ServiceYearViewProps) {
  const summary = summarizeServiceYear(startYear, data);
  const shownTotal = Math.round(useAnimatedNumber(summary.total));

  return (
    <div className="flex flex-col gap-4">
      <PeriodNavigator
        label={strings.serviceYear.title(startYear)}
        previousLabel={strings.serviceYear.previous}
        nextLabel={strings.serviceYear.next}
        onPrevious={() => onYearChange(startYear - 1)}
        onNext={() => onYearChange(startYear + 1)}
      />

      <section aria-label={strings.serviceYear.yearTotal} className="rounded-3xl bg-surface p-5">
        <p className="text-sm text-muted">{strings.serviceYear.yearTotal}</p>
        <p
          className="text-5xl font-bold tracking-tight tabular-nums"
          aria-label={formatDuration(summary.total)}
        >
          {formatDuration(shownTotal)}
        </p>
      </section>

      {/* Keyed by year so the rows animate in when switching years. */}
      <ul key={startYear} className="divide-y divide-line overflow-hidden rounded-3xl bg-surface">
        {summary.months.map((month, index) => (
          <li
            key={month.month}
            className="animate-fade-up"
            style={{ animationDelay: `${index * STAGGER_MS}ms` }}
          >
            <MonthRow summary={month} onOpen={() => onOpenMonth(month.month)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthRow({ summary, onOpen }: { summary: MonthSummary; onOpen: () => void }) {
  const difference = goalDifference(summary);
  const isClosed = summary.close !== undefined;
  const progress = goalProgress(summary.goal, summary.total);
  const { noValue } = strings.serviceYear;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={strings.serviceYear.openMonth(formatMonth(summary.month))}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-surface-strong"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{formatMonthName(summary.month)}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
              isClosed ? 'border-fg bg-fg text-bg' : 'border-line text-muted'
            }`}
          >
            {isClosed ? strings.serviceYear.closed : strings.serviceYear.open}
          </span>
        </span>
        <span className="text-sm text-muted tabular-nums">
          {strings.serviceYear.goal}{' '}
          {summary.goal === undefined ? noValue : formatDuration(summary.goal)} ·{' '}
          {strings.serviceYear.difference}{' '}
          {difference === undefined ? noValue : formatSignedDuration(difference)}
        </span>
        {summary.goal !== undefined && (
          <span aria-hidden="true" className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
            <span
              className="block h-full origin-left rounded-full bg-fg transition-transform duration-700 ease-out"
              style={{ transform: `scaleX(${progress})` }}
            />
          </span>
        )}
      </span>
      <span className="text-lg font-semibold tabular-nums">{formatDuration(summary.total)}</span>
      <span aria-hidden="true" className="text-2xl text-subtle">
        ›
      </span>
    </button>
  );
}
