import { describe, expect, it } from 'vitest';
import { buildListRows } from './listRows';
import { buildClose, summarizeMonth, type MonthData } from './month';
import type { Item } from './types';

// October: entries 1:30 + 0:15 = 1:45, credits 0:40
const items: Item[] = [
  { id: 'a', type: 'entry', date: '2026-10-02', time: '10:00', minutes: 90, createdAt: 1 },
  { id: 'b', type: 'credit', date: '2026-10-20', minutes: 40, createdAt: 2 },
  { id: 'd', type: 'entry', date: '2026-10-21', minutes: 15, createdAt: 4 },
  { id: 'c', type: 'entry', date: '2026-11-01', time: '10:00', minutes: 60, createdAt: 3 },
];
const OCTOBER_ENTRIES = 105;
const OCTOBER_CREDITS = 40;

function rowsFor(month: string, data: MonthData) {
  return buildListRows(summarizeMonth(month, data), data.items);
}

function closedOctober(
  choice: 'roundUp' | 'carryOver',
  credits: 'roundUp' | 'carryOver' = 'carryOver',
): MonthData {
  return {
    items,
    goals: [],
    closes: [buildClose('2026-10', OCTOBER_ENTRIES, OCTOBER_CREDITS, { entries: choice, credits })],
  };
}

const kinds = (rows: ReturnType<typeof rowsFor>) =>
  rows.map((row) => (row.kind === 'item' ? row.item.id : row.kind));

describe('buildListRows', () => {
  it('lists only the month’s items, newest first', () => {
    expect(kinds(rowsFor('2026-10', { items, goals: [], closes: [] }))).toEqual(['d', 'b', 'a']);
  });

  it('adds round-up and credit carry-out rows at the top', () => {
    const rows = rowsFor('2026-10', closedOctober('roundUp'));
    expect(kinds(rows)).toEqual(['roundUp', 'creditCarryOut', 'd', 'b', 'a']);
    expect(rows[0]).toEqual({ kind: 'roundUp', minutes: 15 });
    expect(rows[1]).toEqual({ kind: 'creditCarryOut', minutes: 40, toMonth: '2026-11' });
  });

  it('adds a credit round-up row when the credits are rounded up', () => {
    const rows = rowsFor('2026-10', closedOctober('roundUp', 'roundUp'));
    expect(kinds(rows)).toEqual(['roundUp', 'creditRoundUp', 'd', 'b', 'a']);
    expect(rows[1]).toEqual({ kind: 'creditRoundUp', minutes: 20 });
    expect(kinds(rowsFor('2026-11', closedOctober('roundUp', 'roundUp')))).toEqual(['c']);
  });

  it('adds both carry-out rows when carrying over', () => {
    const rows = rowsFor('2026-10', closedOctober('carryOver'));
    expect(rows[0]).toEqual({ kind: 'carryOut', minutes: 45, toMonth: '2026-11' });
    expect(rows[1]).toEqual({ kind: 'creditCarryOut', minutes: 40, toMonth: '2026-11' });
  });

  it('adds carry-in rows at the bottom of the next month', () => {
    const rows = rowsFor('2026-11', closedOctober('carryOver'));
    expect(kinds(rows)).toEqual(['c', 'creditCarryIn', 'carryIn']);
    expect(rows[1]).toEqual({ kind: 'creditCarryIn', minutes: 40, fromMonth: '2026-10' });
    expect(rows[2]).toEqual({ kind: 'carryIn', minutes: 45, fromMonth: '2026-10' });
  });

  it('adds no adjustment row for a month closed on full hours', () => {
    const data: MonthData = {
      items,
      goals: [],
      closes: [{ month: '2026-11', mode: 'none', adjustment: 0, creditCarry: 0 }],
    };
    expect(kinds(rowsFor('2026-11', data))).toEqual(['c']);
  });

  it('shows older combined closes as before', () => {
    const data: MonthData = {
      items,
      goals: [],
      closes: [{ month: '2026-10', mode: 'carryOver', adjustment: 25 }],
    };
    expect(rowsFor('2026-10', data)[0]).toEqual({
      kind: 'carryOut',
      minutes: 25,
      toMonth: '2026-11',
    });
    expect(kinds(rowsFor('2026-11', data))).toEqual(['c', 'carryIn']);
  });
});
