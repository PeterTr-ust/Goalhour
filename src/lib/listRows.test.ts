import { describe, expect, it } from 'vitest';
import { buildListRows } from './listRows';
import { buildClose, summarizeMonth, type MonthData } from './month';
import type { Item } from './types';

// October: 1:30 + 0:45 = 2:15
const items: Item[] = [
  { id: 'a', type: 'entry', date: '2026-10-02', time: '10:00', minutes: 90, createdAt: 1 },
  { id: 'b', type: 'credit', date: '2026-10-20', minutes: 45, createdAt: 2 },
  { id: 'c', type: 'entry', date: '2026-11-01', time: '10:00', minutes: 60, createdAt: 3 },
];
const OCTOBER_RAW = 135;

function rowsFor(month: string, data: MonthData) {
  return buildListRows(summarizeMonth(month, data), data.items);
}

function closedOctober(choice: 'roundUp' | 'carryOver'): MonthData {
  return { items, goals: [], closes: [buildClose('2026-10', OCTOBER_RAW, choice)] };
}

describe('buildListRows', () => {
  it('lists only the month’s items, newest first', () => {
    const rows = rowsFor('2026-10', { items, goals: [], closes: [] });
    expect(rows.map((row) => (row.kind === 'item' ? row.item.id : row.kind))).toEqual(['b', 'a']);
  });

  it('adds a round-up row at the top', () => {
    const rows = rowsFor('2026-10', closedOctober('roundUp'));
    expect(rows[0]).toEqual({ kind: 'roundUp', minutes: 45 });
    expect(rows).toHaveLength(3);
    expect(rowsFor('2026-11', closedOctober('roundUp')).map((row) => row.kind)).toEqual(['item']);
  });

  it('adds a carry-out row to the closed month', () => {
    const rows = rowsFor('2026-10', closedOctober('carryOver'));
    expect(rows[0]).toEqual({ kind: 'carryOut', minutes: 15, toMonth: '2026-11' });
  });

  it('adds a carry-in row at the bottom of the next month', () => {
    const rows = rowsFor('2026-11', closedOctober('carryOver'));
    expect(rows.map((row) => row.kind)).toEqual(['item', 'carryIn']);
    expect(rows[1]).toEqual({ kind: 'carryIn', minutes: 15, fromMonth: '2026-10' });
  });

  it('adds no adjustment row for a month closed on a full hour', () => {
    const data: MonthData = {
      items,
      goals: [],
      closes: [{ month: '2026-11', mode: 'none', adjustment: 0 }],
    };
    expect(rowsFor('2026-11', data).map((row) => row.kind)).toEqual(['item']);
  });
});
