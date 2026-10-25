import type { YearPlan } from './types';

/** Weeks of a service year used for planning (1 September to 31 August). */
export const WEEKS_PER_SERVICE_YEAR = 52;
export const MONTHS_PER_SERVICE_YEAR = 12;
export const MAX_WEEKS_OFF = WEEKS_PER_SERVICE_YEAR - 1;

export type WeeksOffError = 'invalidNumber' | 'outOfRange';

/** Planned weeks off of a service year; 0 when nothing was planned (not inherited). */
export function weeksOffFor(startYear: number, plans: readonly YearPlan[]): number {
  return plans.find((plan) => plan.startYear === startYear)?.weeksOff ?? 0;
}

/** Weeks off must be a whole number from 0 to 51 (at least one active week). */
export function validateWeeksOff(weeks: number): WeeksOffError | null {
  if (!Number.isInteger(weeks)) {
    return 'invalidNumber';
  }
  return weeks < 0 || weeks > MAX_WEEKS_OFF ? 'outOfRange' : null;
}

export interface MonthlyPlan {
  activeWeeks: number;
  /** Minutes needed in an average month, rounded up to whole minutes. */
  perMonth: number;
}

/**
 * How much an average month needs so that the year goal is reached despite the weeks off.
 * The goal is spread over the active weeks; an average month has 52 / 12 weeks.
 */
export function monthlyPlan(yearGoal: number, weeksOff: number): MonthlyPlan {
  const activeWeeks = WEEKS_PER_SERVICE_YEAR - weeksOff;
  const perActiveWeek = yearGoal / activeWeeks;
  const weeksPerMonth = WEEKS_PER_SERVICE_YEAR / MONTHS_PER_SERVICE_YEAR;
  return { activeWeeks, perMonth: Math.ceil(perActiveWeek * weeksPerMonth) };
}
