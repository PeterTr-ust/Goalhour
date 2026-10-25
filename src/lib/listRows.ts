import { nextMonth, previousMonth } from './calendar';
import { itemsOfMonth, sortNewestFirst, type MonthSummary } from './month';
import type { Item, MonthKey } from './types';

export type ListRow =
  | { kind: 'item'; item: Item }
  | { kind: 'roundUp'; minutes: number }
  | { kind: 'carryOut'; minutes: number; toMonth: MonthKey }
  | { kind: 'creditCarryOut'; minutes: number; toMonth: MonthKey }
  | { kind: 'carryIn'; minutes: number; fromMonth: MonthKey }
  | { kind: 'creditCarryIn'; minutes: number; fromMonth: MonthKey };

/**
 * Rows of the month list, newest first: the close adjustments (end of month), then the
 * items, then the carry-ins from the previous month (start of month).
 */
export function buildListRows(summary: MonthSummary, items: readonly Item[]): ListRow[] {
  const rows: ListRow[] = [];
  const { close, month } = summary;

  if (close?.mode === 'roundUp') {
    rows.push({ kind: 'roundUp', minutes: close.adjustment });
  } else if (close?.mode === 'carryOver') {
    rows.push({ kind: 'carryOut', minutes: close.adjustment, toMonth: nextMonth(month) });
  }
  if (close?.creditCarry) {
    rows.push({ kind: 'creditCarryOut', minutes: close.creditCarry, toMonth: nextMonth(month) });
  }

  for (const item of sortNewestFirst(itemsOfMonth(items, month))) {
    rows.push({ kind: 'item', item });
  }

  if (summary.creditCarryIn > 0) {
    rows.push({
      kind: 'creditCarryIn',
      minutes: summary.creditCarryIn,
      fromMonth: previousMonth(month),
    });
  }
  if (summary.carryIn > 0) {
    rows.push({ kind: 'carryIn', minutes: summary.carryIn, fromMonth: previousMonth(month) });
  }
  return rows;
}
