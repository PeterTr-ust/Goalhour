import { describe, expect, it } from 'vitest';
import { goalProgress, goalStatus, goalTone, resolveGoal, resolveYearGoal } from './goal';
import type { MonthGoal, YearGoal } from './types';

const HOURS_50 = 3000;
const HOURS_40 = 2400;

describe('resolveGoal', () => {
  const goals: MonthGoal[] = [
    { month: '2026-03', minutes: HOURS_40 },
    { month: '2026-01', minutes: HOURS_50 },
  ];

  it('returns undefined before any goal was set', () => {
    expect(resolveGoal('2025-12', goals)).toBeUndefined();
  });

  it('uses the month’s own goal', () => {
    expect(resolveGoal('2026-01', goals)).toBe(HOURS_50);
    expect(resolveGoal('2026-03', goals)).toBe(HOURS_40);
  });

  it('carries the latest earlier goal forward', () => {
    expect(resolveGoal('2026-02', goals)).toBe(HOURS_50);
    expect(resolveGoal('2026-11', goals)).toBe(HOURS_40);
  });
});

describe('resolveYearGoal', () => {
  const goals: YearGoal[] = [
    { startYear: 2027, minutes: 36000 },
    { startYear: 2025, minutes: 30000 },
  ];

  it('returns undefined before any year goal was set', () => {
    expect(resolveYearGoal(2024, goals)).toBeUndefined();
  });

  it('uses the year’s own goal and carries it forward', () => {
    expect(resolveYearGoal(2025, goals)).toBe(30000);
    expect(resolveYearGoal(2026, goals)).toBe(30000);
    expect(resolveYearGoal(2027, goals)).toBe(36000);
    expect(resolveYearGoal(2030, goals)).toBe(36000);
  });
});

describe('goalStatus', () => {
  it('shows the missing time (50:00 goal, 32:30 total -> 17:30)', () => {
    expect(goalStatus(HOURS_50, 1950)).toEqual({ kind: 'missing', minutes: 1050 });
  });

  it('reports a reached goal', () => {
    expect(goalStatus(HOURS_50, HOURS_50)).toEqual({ kind: 'reached' });
  });

  it('reports the excess instead of a negative value', () => {
    expect(goalStatus(HOURS_50, 3150)).toEqual({ kind: 'exceeded', minutes: 150 });
  });

  it('handles a missing goal', () => {
    expect(goalStatus(undefined, 100)).toEqual({ kind: 'noGoal' });
  });
});

describe('goalTone', () => {
  it('is open (red) until the goal is reached, then met (green)', () => {
    expect(goalTone(goalStatus(undefined, 100))).toBe('neutral');
    expect(goalTone(goalStatus(HOURS_50, 0))).toBe('open');
    expect(goalTone(goalStatus(HOURS_50, HOURS_50 - 1))).toBe('open');
    expect(goalTone(goalStatus(HOURS_50, HOURS_50))).toBe('met');
    expect(goalTone(goalStatus(HOURS_50, HOURS_50 + 1))).toBe('met');
  });
});

describe('goalProgress', () => {
  it('is the ratio clamped to 0..1', () => {
    expect(goalProgress(HOURS_50, 1500)).toBe(0.5);
    expect(goalProgress(HOURS_50, 6000)).toBe(1);
    expect(goalProgress(undefined, 6000)).toBe(0);
    expect(goalProgress(0, 0)).toBe(1);
  });
});
