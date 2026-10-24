import { describe, expect, it } from 'vitest';
import { monthKeyOf } from './calendar';
import type { MonthData } from './month';
import type { YearGoal } from './types';
import {
  formatServiceYear,
  goalDifference,
  serviceYearMonths,
  serviceYearOf,
  summarizeServiceYear,
} from './serviceYear';

describe('serviceYearOf', () => {
  it('assigns September to December to the year they start in', () => {
    expect(serviceYearOf('2025-10')).toBe(2025);
    expect(serviceYearOf('2025-12')).toBe(2025);
  });

  it('assigns January to August to the previous start year', () => {
    expect(serviceYearOf('2026-02')).toBe(2025);
  });

  it('splits at 31 August / 1 September', () => {
    expect(serviceYearOf(monthKeyOf('2026-08-31'))).toBe(2025);
    expect(serviceYearOf(monthKeyOf('2026-09-01'))).toBe(2026);
  });
});

describe('serviceYearMonths', () => {
  it('lists September to August', () => {
    const months = serviceYearMonths(2025);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-09');
    expect(months[3]).toBe('2025-12');
    expect(months[4]).toBe('2026-01');
    expect(months[11]).toBe('2026-08');
  });
});

describe('summarizeServiceYear', () => {
  const data: MonthData & { yearGoals: YearGoal[] } = {
    items: [
      { id: 'aug', type: 'entry', date: '2026-08-31', minutes: 615, createdAt: 1 },
      { id: 'sep', type: 'entry', date: '2026-09-01', minutes: 120, createdAt: 2 },
      { id: 'oct', type: 'credit', date: '2026-10-10', minutes: 45, createdAt: 3 },
      { id: 'jun', type: 'entry', date: '2027-06-30', minutes: 30, createdAt: 4 },
    ],
    goals: [{ month: '2026-09', minutes: 600 }],
    closes: [{ month: '2026-08', mode: 'carryOver', adjustment: 15 }],
    yearGoals: [{ startYear: 2025, minutes: 6000 }],
  };

  it('splits entries and credits and explains the rest as balance', () => {
    const summary = summarizeServiceYear(2026, data);
    expect(summary.entries).toBe(150);
    expect(summary.credits).toBe(45);
    // 15 minutes carried in from August of the previous service year.
    expect(summary.balance).toBe(15);
    expect(summary.entries + summary.credits + summary.balance).toBe(summary.total);

    const previous = summarizeServiceYear(2025, data);
    expect(previous.entries).toBe(615);
    // 15 minutes carried out of August into the next service year.
    expect(previous.balance).toBe(-15);
  });

  it('includes round-ups in the balance', () => {
    const roundedUp = {
      ...data,
      closes: [{ month: '2026-09', mode: 'roundUp' as const, adjustment: 45 }],
    };
    const summary = summarizeServiceYear(2026, roundedUp);
    expect(summary.balance).toBe(45);
    expect(summary.total).toBe(240);
  });

  it('resolves the year goal with carry-forward', () => {
    expect(summarizeServiceYear(2025, data).goal).toBe(6000);
    expect(summarizeServiceYear(2026, data).goal).toBe(6000);
    expect(summarizeServiceYear(2024, data).goal).toBeUndefined();
  });

  it('covers September to August with the carry-over from the previous year', () => {
    const summary = summarizeServiceYear(2026, data);
    expect(summary.months.map((m) => m.month)).toEqual(serviceYearMonths(2026));
    expect(summary.months[0]?.carryIn).toBe(15);
    expect(summary.months[0]?.total).toBe(135);
    // 1st September 135 + October 45 + June 30
    expect(summary.total).toBe(210);
  });

  it('keeps 31 August in the previous service year', () => {
    const previous = summarizeServiceYear(2025, data);
    expect(previous.months.at(-1)?.total).toBe(600);
    expect(previous.total).toBe(600);
  });

  it('computes the goal difference', () => {
    const [september, october] = summarizeServiceYear(2026, data).months;
    expect(september && goalDifference(september)).toBe(-465);
    expect(october && goalDifference(october)).toBe(-555);
    const [firstOfPrevious] = summarizeServiceYear(2025, data).months;
    expect(firstOfPrevious && goalDifference(firstOfPrevious)).toBeUndefined();
  });
});

describe('formatServiceYear', () => {
  it('formats as start/short end year', () => {
    expect(formatServiceYear(2025)).toBe('2025/26');
    expect(formatServiceYear(2099)).toBe('2099/00');
  });
});
