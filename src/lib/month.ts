import { MINUTES_PER_HOUR } from './duration';
import { monthKeyOf, nextMonth, previousMonth } from './calendar';
import { resolveGoal } from './goal';
import type { CloseMode, Item, MonthClose, MonthGoal, MonthKey } from './types';

export interface MonthSummary {
  month: MonthKey;
  entries: number;
  credits: number;
  /** Entry minutes carried in from the previous month (carry-over choice). */
  carryIn: number;
  /** Credit minutes carried in automatically from the previous month. */
  creditCarryIn: number;
  /** entries + carryIn: the part settled with the round-up / carry-over choice. */
  entryRaw: number;
  /** credits + creditCarryIn: the part whose remainder is always carried over. */
  creditRaw: number;
  /** entryRaw + creditRaw */
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

/** Entry minutes carried into a month from a previous month closed with carry-over. */
export function carryInOf(closes: readonly MonthClose[], month: MonthKey): number {
  const previous = findClose(closes, previousMonth(month));
  return previous?.mode === 'carryOver' ? previous.adjustment : 0;
}

/** Credit minutes carried into a month automatically from the previous month. */
export function creditCarryInOf(closes: readonly MonthClose[], month: MonthKey): number {
  return findClose(closes, previousMonth(month))?.creditCarry ?? 0;
}

/**
 * Final total of a month. Works for both close formats: older closes have no credit carry,
 * so their adjustment applies to the combined total exactly as before.
 */
export function applyClose(raw: number, close: MonthClose | undefined): number {
  if (close === undefined) {
    return raw;
  }
  const creditCarry = close.creditCarry ?? 0;
  switch (close.mode) {
    case 'roundUp':
      return raw - creditCarry + close.adjustment;
    case 'carryOver':
      return raw - creditCarry - close.adjustment;
    default:
      return raw - creditCarry;
  }
}

export function summarizeMonth(month: MonthKey, data: MonthData): MonthSummary {
  const monthItems = itemsOfMonth(data.items, month);
  const sumOf = (type: Item['type']) =>
    monthItems.filter((item) => item.type === type).reduce((sum, item) => sum + item.minutes, 0);

  const entries = sumOf('entry');
  const credits = sumOf('credit');
  const carryIn = carryInOf(data.closes, month);
  const creditCarryIn = creditCarryInOf(data.closes, month);
  const entryRaw = entries + carryIn;
  const creditRaw = credits + creditCarryIn;
  const raw = entryRaw + creditRaw;
  const close = findClose(data.closes, month);

  return {
    month,
    entries,
    credits,
    carryIn,
    creditCarryIn,
    entryRaw,
    creditRaw,
    raw,
    total: applyClose(raw, close),
    goal: resolveGoal(month, data.goals),
    close,
  };
}

export type CloseChoice = Exclude<CloseMode, 'none'>;

/** Minutes that must leave the month so that the credits end on a full hour. */
export function creditRemainder(creditRaw: number): number {
  return creditRaw % MINUTES_PER_HOUR;
}

/**
 * Builds the close record. Entries and credits are settled separately: the entry remainder
 * follows the user's choice, the credit remainder is always carried into the next month.
 */
export function buildClose(
  month: MonthKey,
  entryRaw: number,
  creditRaw: number,
  choice: CloseChoice,
): MonthClose {
  const creditCarry = creditRemainder(creditRaw);
  const remainder = entryRaw % MINUTES_PER_HOUR;
  if (remainder === 0) {
    return { month, mode: 'none', adjustment: 0, creditCarry };
  }
  if (choice === 'roundUp') {
    return { month, mode: 'roundUp', adjustment: MINUTES_PER_HOUR - remainder, creditCarry };
  }
  return { month, mode: 'carryOver', adjustment: remainder, creditCarry };
}

/** The user only has to choose when the entries do not end on a full hour. */
export function needsCloseChoice(entryRaw: number): boolean {
  return entryRaw % MINUTES_PER_HOUR !== 0;
}

/**
 * Carrying minutes is only possible while the next month is still open, otherwise the
 * carried minutes would change an already closed month.
 */
export function canCarryOver(closes: readonly MonthClose[], month: MonthKey): boolean {
  return !isMonthClosed(closes, nextMonth(month));
}

/** A month can only be reopened while the following month is open. */
export function canReopen(closes: readonly MonthClose[], month: MonthKey): boolean {
  return isMonthClosed(closes, month) && !isMonthClosed(closes, nextMonth(month));
}
