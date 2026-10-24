import { addMonths, parseMonthKey, toMonthKey } from './calendar';
import { resolveYearGoal } from './goal';
import { summarizeMonth, type MonthData, type MonthSummary } from './month';
import type { MonthKey, YearGoal } from './types';

/** The service year starts on 1 September and ends on 31 August. */
export const SERVICE_YEAR_START_MONTH = 9;
const MONTHS_PER_SERVICE_YEAR = 12;
const SHORT_YEAR_MODULO = 100;
const SHORT_YEAR_DIGITS = 2;

/** Returns the calendar year in which the service year containing the month started. */
export function serviceYearOf(key: MonthKey): number {
  const { year, month } = parseMonthKey(key);
  return month >= SERVICE_YEAR_START_MONTH ? year : year - 1;
}

/** All twelve months of a service year, September to August. */
export function serviceYearMonths(startYear: number): MonthKey[] {
  const first = toMonthKey(startYear, SERVICE_YEAR_START_MONTH);
  return Array.from({ length: MONTHS_PER_SERVICE_YEAR }, (_, index) => addMonths(first, index));
}

export interface ServiceYearSummary {
  months: MonthSummary[];
  /** Sum of the entries of all months. */
  entries: number;
  /** Sum of the credits of all months. */
  credits: number;
  /**
   * Net effect of carry-overs and round-ups: carry-in into September, minus carry-out from
   * August, plus all round-ups. total = entries + credits + balance.
   */
  balance: number;
  /** Sum of the month totals. */
  total: number;
  goal: number | undefined;
}

export function summarizeServiceYear(
  startYear: number,
  data: MonthData & { yearGoals: readonly YearGoal[] },
): ServiceYearSummary {
  const months = serviceYearMonths(startYear).map((month) => summarizeMonth(month, data));
  const sum = (pick: (month: MonthSummary) => number) =>
    months.reduce((total, month) => total + pick(month), 0);
  const entries = sum((month) => month.entries);
  const credits = sum((month) => month.credits);
  const total = sum((month) => month.total);
  return {
    months,
    entries,
    credits,
    balance: total - entries - credits,
    total,
    goal: resolveYearGoal(startYear, data.yearGoals),
  };
}

/** Difference between total and goal (positive = above goal), undefined without a goal. */
export function goalDifference(summary: MonthSummary): number | undefined {
  return summary.goal === undefined ? undefined : summary.total - summary.goal;
}

/** Formats a service year as "2025/26". */
export function formatServiceYear(startYear: number): string {
  const endShort = String((startYear + 1) % SHORT_YEAR_MODULO).padStart(SHORT_YEAR_DIGITS, '0');
  return `${startYear}/${endShort}`;
}
