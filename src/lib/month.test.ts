import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';
import {
  buildClose,
  canCarryOver,
  canReopen,
  carriesIntoNextMonth,
  closeChoicesNeeded,
  needsCloseChoice,
  sortNewestFirst,
  summarizeMonth,
  type CloseChoice,
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

/**
 * Closes the month like the app does: computes the raw totals first, then stores the close.
 * The credit choice defaults to carry-over.
 */
function close(
  month: string,
  current: MonthData,
  entries: CloseChoice,
  credits: CloseChoice = 'carryOver',
): MonthData {
  const { entryRaw, creditRaw } = summarizeMonth(month, current);
  return {
    ...current,
    closes: [...current.closes, buildClose(month, entryRaw, creditRaw, { entries, credits })],
  };
}

function findCloseOf(current: MonthData, month: string): MonthClose | undefined {
  return current.closes.find((c) => c.month === month);
}

function requireClose(current: MonthData, month: string): MonthClose {
  const found = findCloseOf(current, month);
  if (!found) {
    throw new Error(`No close for ${month}`);
  }
  return found;
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
  const october = data([item('entry', '2026-10-05', 3000), item('entry', '2026-10-06', 150)]);

  it('needs no choice for a whole hour total', () => {
    expect(needsCloseChoice(3000, 0)).toBe(false);
    expect(needsCloseChoice(3150, 0)).toBe(true);
    expect(buildClose('2026-10', 3000, 0, { entries: 'roundUp', credits: 'roundUp' })).toEqual({
      month: '2026-10',
      mode: 'none',
      adjustment: 0,
      creditCarry: 0,
    });
  });

  it('rounds up 52:30 to 53:00', () => {
    const closed = close('2026-10', october, 'roundUp');
    const summary = summarizeMonth('2026-10', closed);
    expect(summary.close).toEqual({
      month: '2026-10',
      mode: 'roundUp',
      adjustment: 30,
      creditCarry: 0,
    });
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

describe('settling credits separately', () => {
  // Entries 50:20, credits 2:30.
  const october = data([item('entry', '2026-10-05', 3020), item('credit', '2026-10-06', 150)]);

  it('asks about both remainders', () => {
    const summary = summarizeMonth('2026-10', october);
    expect(summary.entryRaw).toBe(3020);
    expect(summary.creditRaw).toBe(150);
    expect(closeChoicesNeeded(summary.entryRaw, summary.creditRaw)).toEqual({
      entries: true,
      credits: true,
    });
    expect(needsCloseChoice(summary.entryRaw, summary.creditRaw)).toBe(true);
  });

  it('asks only about the part that does not end on a full hour', () => {
    expect(closeChoicesNeeded(3000, 150)).toEqual({ entries: false, credits: true });
    expect(closeChoicesNeeded(3020, 120)).toEqual({ entries: true, credits: false });
    expect(needsCloseChoice(3000, 120)).toBe(false);
  });

  it('rounds up the hours and carries the credits over', () => {
    const closed = close('2026-10', october, 'roundUp', 'carryOver');
    expect(findCloseOf(closed, '2026-10')).toEqual({
      month: '2026-10',
      mode: 'roundUp',
      adjustment: 40,
      creditCarry: 30,
    });
    // 51:00 hours + 2:00 credits
    expect(formatDuration(summarizeMonth('2026-10', closed).total)).toBe('53:00');

    const november = summarizeMonth('2026-11', closed);
    expect(november.carryIn).toBe(0);
    expect(formatDuration(november.creditCarryIn)).toBe('0:30');
    expect(formatDuration(november.total)).toBe('0:30');
  });

  it('rounds up the credits like the hours (2:30 -> 3:00)', () => {
    const closed = close('2026-10', october, 'carryOver', 'roundUp');
    expect(findCloseOf(closed, '2026-10')).toEqual({
      month: '2026-10',
      mode: 'carryOver',
      adjustment: 20,
      creditCarry: 0,
      creditRoundUp: 30,
    });
    // 50:00 hours + 3:00 credits
    expect(formatDuration(summarizeMonth('2026-10', closed).total)).toBe('53:00');
    const november = summarizeMonth('2026-11', closed);
    expect(november.carryIn).toBe(20);
    expect(november.creditCarryIn).toBe(0);
  });

  it('rounds up both', () => {
    const closed = close('2026-10', october, 'roundUp', 'roundUp');
    expect(formatDuration(summarizeMonth('2026-10', closed).total)).toBe('54:00');
    expect(carriesIntoNextMonth(requireClose(closed, '2026-10'))).toBe(false);
  });

  it('carries both remainders separately', () => {
    const closed = close('2026-10', october, 'carryOver', 'carryOver');
    // 50:00 hours + 2:00 credits
    expect(formatDuration(summarizeMonth('2026-10', closed).total)).toBe('52:00');
    expect(carriesIntoNextMonth(requireClose(closed, '2026-10'))).toBe(true);

    const november = summarizeMonth('2026-11', closed);
    expect(formatDuration(november.carryIn)).toBe('0:20');
    expect(formatDuration(november.creditCarryIn)).toBe('0:30');
    expect(formatDuration(november.total)).toBe('0:50');
  });

  it('ignores the credit choice when the credits end on a full hour', () => {
    const closed = close(
      '2026-10',
      data([item('credit', '2026-10-06', 120)]),
      'roundUp',
      'roundUp',
    );
    expect(findCloseOf(closed, '2026-10')).toEqual({
      month: '2026-10',
      mode: 'none',
      adjustment: 0,
      creditCarry: 0,
    });
    expect(summarizeMonth('2026-10', closed).total).toBe(120);
  });

  it('chains credit carry-overs and adds them to the next credits', () => {
    let state = data([
      item('credit', '2026-10-06', 150), // 2:30 -> 2:00, 0:30 carried
      item('credit', '2026-11-06', 45), // 0:45 + 0:30 = 1:15 -> 1:00, 0:15 carried
    ]);
    state = close('2026-10', state, 'roundUp');
    state = close('2026-11', state, 'roundUp');
    expect(summarizeMonth('2026-11', state).total).toBe(60);
    expect(summarizeMonth('2026-12', state).creditCarryIn).toBe(15);
  });

  it('rounds up credits that include a carry-in', () => {
    let state = data([item('credit', '2026-10-06', 150), item('credit', '2026-11-06', 45)]);
    state = close('2026-10', state, 'roundUp', 'carryOver');
    // November: 0:45 + 0:30 carried = 1:15, rounded up to 2:00.
    state = close('2026-11', state, 'roundUp', 'roundUp');
    expect(summarizeMonth('2026-11', state).total).toBe(120);
    expect(summarizeMonth('2026-12', state).creditCarryIn).toBe(0);
  });

  it('carries credits across the service year boundary (August to September)', () => {
    const state = close('2026-08', data([item('credit', '2026-08-31', 100)]), 'roundUp');
    expect(summarizeMonth('2026-08', state).total).toBe(60);
    expect(summarizeMonth('2026-09', state).creditCarryIn).toBe(40);
  });

  it('drops credit carry-over and credit round-up when the month is reopened', () => {
    const carried = reopen('2026-10', close('2026-10', october, 'roundUp', 'carryOver'));
    expect(summarizeMonth('2026-11', carried).creditCarryIn).toBe(0);
    expect(summarizeMonth('2026-10', carried).total).toBe(3170);
    const rounded = reopen('2026-10', close('2026-10', october, 'roundUp', 'roundUp'));
    expect(summarizeMonth('2026-10', rounded).total).toBe(3170);
  });

  it('keeps closes from the automatic credit carry period unchanged', () => {
    // Closed while credit remainders were always carried: only creditCarry, no round-up.
    const automatic: MonthClose = {
      month: '2026-10',
      mode: 'roundUp',
      adjustment: 40,
      creditCarry: 30,
    };
    const state = data(
      [item('entry', '2026-10-05', 3020), item('credit', '2026-10-06', 150)],
      [automatic],
    );
    expect(summarizeMonth('2026-10', state).total).toBe(3180);
    expect(summarizeMonth('2026-11', state).creditCarryIn).toBe(30);
  });

  it('keeps older combined closes unchanged next to new ones', () => {
    // September closed with the old combined rule, October with the new one.
    const legacy: MonthClose = { month: '2026-09', mode: 'carryOver', adjustment: 30 };
    let state = data(
      [
        item('entry', '2026-09-05', 3000),
        item('credit', '2026-09-06', 150),
        item('credit', '2026-10-06', 50),
      ],
      [legacy],
    );
    expect(summarizeMonth('2026-09', state).total).toBe(3120);
    // The old carry-over counts on the hours side.
    expect(summarizeMonth('2026-10', state).carryIn).toBe(30);

    state = close('2026-10', state, 'carryOver', 'carryOver');
    // Hours 0:30 carried on, credits 0:50 carried on: nothing left in October.
    expect(summarizeMonth('2026-10', state).total).toBe(0);
    expect(summarizeMonth('2026-11', state).carryIn).toBe(30);
    expect(summarizeMonth('2026-11', state).creditCarryIn).toBe(50);
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
