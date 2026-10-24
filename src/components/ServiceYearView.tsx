import { useState } from 'react';
import { setYearGoal } from '../db/repository';
import type { StoredData } from '../hooks/useStoredData';
import { formatDuration, formatSignedDuration } from '../lib/duration';
import { goalProgress, goalStatus, goalTone, type GoalTone } from '../lib/goal';
import type { MonthSummary } from '../lib/month';
import {
  formatServiceYear,
  goalDifference,
  summarizeServiceYear,
  type ServiceYearSummary,
} from '../lib/serviceYear';
import { formatMonth, formatMonthName, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { GoalDialog } from './GoalDialog';
import { GoalButton, GoalHeadline, SummaryRow } from './GoalOverview';
import { PeriodNavigator } from './PeriodNavigator';
import { StatusBadge } from './StatusBadge';

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

const STAGGER_MS = 30;

const TONE_BARS: Record<GoalTone, string> = {
  neutral: 'bg-fg',
  open: 'bg-danger',
  met: 'bg-success',
};

interface ServiceYearViewProps {
  startYear: number;
  data: StoredData;
  onYearChange: (startYear: number) => void;
  onOpenMonth: (month: MonthKey) => void;
  run: RunAction;
}

export function ServiceYearView({
  startYear,
  data,
  onYearChange,
  onOpenMonth,
  run,
}: ServiceYearViewProps) {
  const [editingGoal, setEditingGoal] = useState(false);
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

      <YearSummaryCard summary={summary} onEditGoal={() => setEditingGoal(true)} />

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

      {editingGoal && (
        <GoalDialog
          title={strings.goalDialog.yearTitle}
          description={strings.goalDialog.yearDescription(formatServiceYear(startYear))}
          currentGoal={summary.goal}
          onSave={(minutes) => run(() => setYearGoal(startYear, minutes))}
          onClose={() => setEditingGoal(false)}
        />
      )}
    </div>
  );
}

function YearSummaryCard({
  summary,
  onEditGoal,
}: {
  summary: ServiceYearSummary;
  onEditGoal: () => void;
}) {
  return (
    <section aria-label={strings.serviceYear.yearTotal} className="rounded-3xl bg-surface p-5">
      <GoalHeadline
        caption={strings.serviceYear.yearTotal}
        progressLabel={strings.serviceYear.progress}
        total={summary.total}
        goal={summary.goal}
      />
      <dl className="mt-5 divide-y divide-line text-base">
        <SummaryRow label={strings.serviceYear.entries} value={formatDuration(summary.entries)} />
        <SummaryRow label={strings.serviceYear.credits} value={formatDuration(summary.credits)} />
        {summary.balance !== 0 && (
          <SummaryRow
            label={strings.serviceYear.balance}
            value={formatSignedDuration(summary.balance)}
          />
        )}
        <SummaryRow
          label={strings.serviceYear.total}
          value={formatDuration(summary.total)}
          strong
        />
      </dl>
      <GoalButton
        label={strings.serviceYear.yearGoal}
        goal={summary.goal}
        setLabel={strings.serviceYear.setYearGoal}
        editLabel={strings.serviceYear.editYearGoal}
        onClick={onEditGoal}
      />
    </section>
  );
}

function MonthRow({ summary, onOpen }: { summary: MonthSummary; onOpen: () => void }) {
  const difference = goalDifference(summary);
  const progress = goalProgress(summary.goal, summary.total);
  const tone = goalTone(goalStatus(summary.goal, summary.total));
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
          <StatusBadge closed={summary.close !== undefined} />
        </span>
        <span className="text-sm text-muted tabular-nums">
          {strings.serviceYear.breakdown(
            formatDuration(summary.entries),
            formatDuration(summary.credits),
          )}
        </span>
        <span className="text-sm text-muted tabular-nums">
          {strings.serviceYear.goal}{' '}
          {summary.goal === undefined ? noValue : formatDuration(summary.goal)} ·{' '}
          {strings.serviceYear.difference}{' '}
          {difference === undefined ? (
            noValue
          ) : (
            <span className={difference < 0 ? 'text-danger' : 'text-success'}>
              {formatSignedDuration(difference)}
            </span>
          )}
        </span>
        {summary.goal !== undefined && (
          <span aria-hidden="true" className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
            <span
              className={`block h-full origin-left rounded-full transition-transform duration-700 ease-out ${TONE_BARS[tone]}`}
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
