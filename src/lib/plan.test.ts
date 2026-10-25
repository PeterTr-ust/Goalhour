import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';
import { monthlyPlan, validateWeeksOff, weeksOffFor } from './plan';

const HOURS_600 = 600 * 60;

describe('monthlyPlan', () => {
  it('spreads the goal evenly without weeks off', () => {
    expect(monthlyPlan(HOURS_600, 0)).toEqual({ activeWeeks: 52, perMonth: 3000 });
  });

  it('raises the monthly target for weeks off (600 h, 4 weeks off -> 54:10)', () => {
    const plan = monthlyPlan(HOURS_600, 4);
    expect(plan.activeWeeks).toBe(48);
    expect(formatDuration(plan.perMonth)).toBe('54:10');
  });

  it('rounds up to whole minutes so the goal is never missed', () => {
    // 100 h with 3 weeks off: 6000 / 49 * 52 / 12 = 530.6... minutes
    expect(monthlyPlan(6000, 3).perMonth).toBe(531);
  });

  it('handles a goal of zero', () => {
    expect(monthlyPlan(0, 10).perMonth).toBe(0);
  });
});

describe('weeksOffFor', () => {
  it('uses the plan of that year only, otherwise 0', () => {
    const plans = [{ startYear: 2025, weeksOff: 6 }];
    expect(weeksOffFor(2025, plans)).toBe(6);
    expect(weeksOffFor(2026, plans)).toBe(0);
  });
});

describe('validateWeeksOff', () => {
  it('accepts 0 to 51 whole weeks', () => {
    expect(validateWeeksOff(0)).toBeNull();
    expect(validateWeeksOff(51)).toBeNull();
  });

  it('rejects other values', () => {
    expect(validateWeeksOff(52)).toBe('outOfRange');
    expect(validateWeeksOff(-1)).toBe('outOfRange');
    expect(validateWeeksOff(1.5)).toBe('invalidNumber');
    expect(validateWeeksOff(Number.NaN)).toBe('invalidNumber');
  });
});
