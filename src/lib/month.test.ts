import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';
import {
  buildClose,
  canCarryOver,
  canReopen,
  needsCloseChoice,
  sortNewestFirst,
  summarizeMonth,
  type MonthData,
} from './month';
import type { Item, MonthClose } from './types';

let nextId = 0;
function item(type: Item['type'], date: string, minutes: number, time?: string): Item {
  nextId += 1;
  return {
    id: `test-${nextId}`,
    type,
    date,
    minutes,
    createdAt: nextId,
    ...(time === undefined ? {} : { time }),
  };
}

function data(items: Item[], closes: MonthClose[] = []): MonthData {
  return { items, goals: [], closes };
}

/** Closes the month like the app does: computes the raw total first, then stores the close. */
function close(month: string, current: MonthData, choice: 'roundUp' | 'carryOver'): MonthData {
  const { raw } = summarizeMonth(month, current);
  return { ...current, closes: [...current.closes, buildClose(month, raw, choice)] };
}

/** Removes a month's close, like reopening it. */
function reopen(month: string, current: MonthData): MonthData {
  return { ...current, closes: current.closes.filter((c) => c.month !== month) };
}

describe('summarizeMonth', () => {
  it('sums entries and credits of the month only', () => {
    const summary = summarizeMonth(
      '2026-10',
      data([
        item('entry', '2026-10-01', 90),
        item('entry', '2026-10-31', 45),
        item('credit', '2026-10-15', 120),
        item('entry', '2026-09-30', 600),
        item('credit', '2026-11-01', 600),
      ]),
    );
    expect(summary.entries).toBe(135);
    expect(summary.credits).toBe(120);
    expect(summary.carryIn).toBe(0);
    expect(summary.raw).toBe(255);
    expect(summary.total).toBe(255);
    expect(summary.close).toBeUndefined();
  });

  it('carries minutes into hours (0:45 + 0:30 = 1:15)', () => {
    const summary = summarizeMonth(
      '2026-10',
      data([item('entry', '2026-10-01', 45), item('entry', '2026-10-02', 30)]),
    );
    expect(formatDuration(summary.total)).toBe('1:15');
  });
});

describe('closing a month', () => {
  const october = data([item('entry', '2026-10-05', 3000), item('credit', '2026-10-06', 150)]);

  it('needs no choice for a whole hour total', () => {
    expect(needsCloseChoice(3000)).toBe(false);
    expect(needsCloseChoice(3150)).toBe(true);
    expect(buildClose('2026-10', 3000, 'roundUp')).toEqual({
      month: '2026-10',
      mode: 'none',
      adjustment: 0,
    });
  });

  it('rounds up 52:30 to 53:00', () => {
    const closed = close('2026-10', october, 'roundUp');
    const summary = summarizeMonth('2026-10', closed);
    expect(summary.close).toEqual({ month: '2026-10', mode: 'roundUp', adjustment: 30 });
    expect(formatDuration(summary.total)).toBe('53:00');
    expect(summarizeMonth('2026-11', closed).carryIn).toBe(0);
  });

  it('keeps 52:00 at 52:00 when rounding up', () => {
    const fullHours = data([item('entry', '2026-10-05', 3120)]);
    const summary = summarizeMonth('2026-10', close('2026-10', fullHours, 'roundUp'));
    expect(summary.close?.mode).toBe('none');
    expect(formatDuration(summary.total)).toBe('52:00');
  });

  it('carries 0:30 of 52:30 into the next month', () => {
    const closed = close('2026-10', october, 'carryOver');
    expect(formatDuration(summarizeMonth('2026-10', closed).total)).toBe('52:00');

    const november = summarizeMonth('2026-11', closed);
    expect(formatDuration(november.carryIn)).toBe('0:30');
    expect(formatDuration(november.total)).toBe('0:30');
  });

  it('chains carry-over across several months', () => {
    let state = data([
      item('entry', '2026-10-05', 100), // 1:40
      item('entry', '2026-11-05', 50), // 0:50 + 0:40 carried = 1:30
      item('entry', '2026-12-05', 20), // 0:20 + 0:30 carried = 0:50
    ]);
    state = close('2026-10', state, 'carryOver');
    state = close('2026-11', state, 'carryOver');
    state = close('2026-12', state, 'carryOver');

    expect(summarizeMonth('2026-10', state).total).toBe(60);
    expect(summarizeMonth('2026-11', state).carryIn).toBe(40);
    expect(summarizeMonth('2026-11', state).total).toBe(60);
    expect(summarizeMonth('2026-12', state).carryIn).toBe(30);
    expect(summarizeMonth('2026-12', state).total).toBe(0);
    expect(summarizeMonth('2027-01', state).carryIn).toBe(50);
  });

  it('carries over across the service year boundary (August to September)', () => {
    const state = close('2026-08', data([item('entry', '2026-08-31', 615)]), 'carryOver');
    expect(summarizeMonth('2026-08', state).total).toBe(600);
    expect(summarizeMonth('2026-09', state).carryIn).toBe(15);
  });

  it('carries over across the calendar year boundary', () => {
    const state = close('2026-12', data([item('entry', '2026-12-31', 75)]), 'carryOver');
    expect(summarizeMonth('2027-01', state).carryIn).toBe(15);
  });
});

describe('reopening a month', () => {
  it('drops the round-up adjustment', () => {
    const base = data([item('entry', '2026-10-05', 3150)]);
    const reopened = reopen('2026-10', close('2026-10', base, 'roundUp'));
    const summary = summarizeMonth('2026-10', reopened);
    expect(summary.close).toBeUndefined();
    expect(formatDuration(summary.total)).toBe('52:30');
  });

  it('removes the carry-over from the next month', () => {
    const base = data([item('entry', '2026-10-05', 3150)]);
    const reopened = reopen('2026-10', close('2026-10', base, 'carryOver'));
    expect(summarizeMonth('2026-11', reopened).carryIn).toBe(0);
  });

  it('is only allowed while the next month is open', () => {
    let state = data([item('entry', '2026-10-05', 3150), item('entry', '2026-11-05', 60)]);
    state = close('2026-10', state, 'carryOver');
    expect(canReopen(state.closes, '2026-10')).toBe(true);
    expect(canReopen(state.closes, '2026-11')).toBe(false);

    state = close('2026-11', state, 'roundUp');
    expect(canReopen(state.closes, '2026-10')).toBe(false);
    expect(canReopen(state.closes, '2026-11')).toBe(true);
  });

  it('can be closed again with a different choice', () => {
    const base = data([item('entry', '2026-10-05', 3150)]);
    const state = close(
      '2026-10',
      reopen('2026-10', close('2026-10', base, 'carryOver')),
      'roundUp',
    );
    expect(summarizeMonth('2026-10', state).total).toBe(3180);
    expect(summarizeMonth('2026-11', state).carryIn).toBe(0);
  });
});

describe('canCarryOver', () => {
  it('is not allowed when the next month is already closed', () => {
    const closes: MonthClose[] = [{ month: '2026-11', mode: 'none', adjustment: 0 }];
    expect(canCarryOver(closes, '2026-10')).toBe(false);
    expect(canCarryOver(closes, '2026-11')).toBe(true);
  });
});

describe('sortNewestFirst', () => {
  it('orders by date, then time, then creation', () => {
    const a = item('entry', '2026-10-01', 10, '08:00');
    const b = item('entry', '2026-10-02', 10, '07:00');
    const c = item('entry', '2026-10-02', 10, '09:00');
    const d = item('credit', '2026-10-02', 10);
    const e = item('credit', '2026-10-02', 10);
    expect(sortNewestFirst([a, b, c, d, e]).map((i) => i.id)).toEqual([
      c.id,
      b.id,
      e.id,
      d.id,
      a.id,
    ]);
  });
});
