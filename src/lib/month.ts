import { MINUTES_PER_HOUR } from './duration';
import { monthKeyOf, nextMonth, previousMonth } from './calendar';
import { resolveGoal } from './goal';
import type { CloseMode, Item, MonthClose, MonthGoal, MonthKey } from './types';

export interface MonthSummary {
  month: MonthKey;
  entries: number;
  credits: number;
  carryIn: number;
  /** entries + credits + carryIn */
  raw: number;
  /** Final total: raw adjusted by the close, or raw while the month is open. */
  total: number;
  goal: number | undefined;
  close: MonthClose | undefined;
}

export interface MonthData {
  items: readonly Item[];
  goals: readonly MonthGoal[];
  closes: readonly MonthClose[];
}

export function itemsOfMonth(items: readonly Item[], month: MonthKey): Item[] {
  return items.filter((item) => monthKeyOf(item.date) === month);
}

/** Sorts items newest first by date, then time, then creation. */
export function sortNewestFirst(items: readonly Item[]): Item[] {
  return [...items].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.time ?? '').localeCompare(a.time ?? '') ||
      b.createdAt - a.createdAt,
  );
}

export function findClose(closes: readonly MonthClose[], month: MonthKey): MonthClose | undefined {
  return closes.find((close) => close.month === month);
}

export function isMonthClosed(closes: readonly MonthClose[], month: MonthKey): boolean {
  return findClose(closes, month) !== undefined;
}

/** Minutes carried into a month from a previous month closed with carry-over. */
export function carryInOf(closes: readonly MonthClose[], month: MonthKey): number {
  const previous = findClose(closes, previousMonth(month));
  return previous?.mode === 'carryOver' ? previous.adjustment : 0;
}

export function applyClose(raw: number, close: MonthClose | undefined): number {
  switch (close?.mode) {
    case 'roundUp':
      return raw + close.adjustment;
    case 'carryOver':
      return raw - close.adjustment;
    default:
      return raw;
  }
}

export function summarizeMonth(month: MonthKey, data: MonthData): MonthSummary {
  const monthItems = itemsOfMonth(data.items, month);
  const sumOf = (type: Item['type']) =>
    monthItems.filter((item) => item.type === type).reduce((sum, item) => sum + item.minutes, 0);

  const entries = sumOf('entry');
  const credits = sumOf('credit');
  const carryIn = carryInOf(data.closes, month);
  const raw = entries + credits + carryIn;
  const close = findClose(data.closes, month);

  return {
    month,
    entries,
    credits,
    carryIn,
    raw,
    total: applyClose(raw, close),
    goal: resolveGoal(month, data.goals),
    close,
  };
}

export type CloseChoice = Exclude<CloseMode, 'none'>;

/** Builds the close record for a month with the given raw total and choice. */
export function buildClose(month: MonthKey, raw: number, choice: CloseChoice): MonthClose {
  const remainder = raw % MINUTES_PER_HOUR;
  if (remainder === 0) {
    return { month, mode: 'none', adjustment: 0 };
  }
  if (choice === 'roundUp') {
    return { month, mode: 'roundUp', adjustment: MINUTES_PER_HOUR - remainder };
  }
  return { month, mode: 'carryOver', adjustment: remainder };
}

export function needsCloseChoice(raw: number): boolean {
  return raw % MINUTES_PER_HOUR !== 0;
}

/**
 * Carry-over is only possible while the next month is still open, otherwise the
 * carried minutes would change an already closed month.
 */
export function canCarryOver(closes: readonly MonthClose[], month: MonthKey): boolean {
  return !isMonthClosed(closes, nextMonth(month));
}

/** A month can only be reopened while the following month is open. */
export function canReopen(closes: readonly MonthClose[], month: MonthKey): boolean {
  return isMonthClosed(closes, month) && !isMonthClosed(closes, nextMonth(month));
}
