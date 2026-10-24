import { formatDuration, formatSignedDuration } from '../lib/duration';
import type { MonthData, MonthSummary } from '../lib/month';
import { goalDifference, summarizeServiceYear } from '../lib/serviceYear';
import { formatMonth, formatMonthName, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { PeriodNavigator } from './PeriodNavigator';

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

  return (
    <div className="flex flex-col gap-4">
      <PeriodNavigator
        label={strings.serviceYear.title(startYear)}
        previousLabel={strings.serviceYear.previous}
        nextLabel={strings.serviceYear.next}
        onPrevious={() => onYearChange(startYear - 1)}
        onNext={() => onYearChange(startYear + 1)}
      />

      <section
        aria-label={strings.serviceYear.yearTotal}
        className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {strings.serviceYear.yearTotal}
        </p>
        <p className="text-5xl font-bold tracking-tight tabular-nums">
          {formatDuration(summary.total)}
        </p>
      </section>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-3xl bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
        {summary.months.map((month) => (
          <li key={month.month}>
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
  const { noValue } = strings.serviceYear;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={strings.serviceYear.openMonth(formatMonth(summary.month))}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{formatMonthName(summary.month)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isClosed
                ? 'bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {isClosed ? strings.serviceYear.closed : strings.serviceYear.open}
          </span>
        </span>
        <span className="text-sm text-slate-600 tabular-nums dark:text-slate-400">
          {strings.serviceYear.goal}{' '}
          {summary.goal === undefined ? noValue : formatDuration(summary.goal)} ·{' '}
          {strings.serviceYear.difference}{' '}
          {difference === undefined ? noValue : formatSignedDuration(difference)}
        </span>
      </span>
      <span className="text-lg font-semibold tabular-nums">{formatDuration(summary.total)}</span>
      <span aria-hidden="true" className="text-2xl text-slate-400">
        ›
      </span>
    </button>
  );
}
