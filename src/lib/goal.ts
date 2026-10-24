import type { MonthGoal, MonthKey } from './types';

/**
 * Returns the goal for a month: its own goal if set, otherwise the goal of the latest
 * earlier month that has one, otherwise undefined.
 */
export function resolveGoal(month: MonthKey, goals: readonly MonthGoal[]): number | undefined {
  let best: MonthGoal | undefined;
  for (const goal of goals) {
    if (goal.month <= month && (best === undefined || goal.month > best.month)) {
      best = goal;
    }
  }
  return best?.minutes;
}

export type GoalStatus =
  | { kind: 'noGoal' }
  | { kind: 'missing'; minutes: number }
  | { kind: 'reached' }
  | { kind: 'exceeded'; minutes: number };

export function goalStatus(goal: number | undefined, total: number): GoalStatus {
  if (goal === undefined) {
    return { kind: 'noGoal' };
  }
  const remaining = goal - total;
  if (remaining > 0) {
    return { kind: 'missing', minutes: remaining };
  }
  if (remaining === 0) {
    return { kind: 'reached' };
  }
  return { kind: 'exceeded', minutes: -remaining };
}

/** Progress towards the goal between 0 and 1. A goal of zero counts as complete. */
export function goalProgress(goal: number | undefined, total: number): number {
  if (goal === undefined) {
    return 0;
  }
  if (goal <= 0) {
    return 1;
  }
  return Math.min(Math.max(total / goal, 0), 1);
}
