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
  /** credits + creditCarryIn: settled by its own round-up / carry-over choice. */
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

/** Credit minutes carried into a month from the previous month. */
export function creditCarryInOf(closes: readonly MonthClose[], month: MonthKey): number {
  return findClose(closes, previousMonth(month))?.creditCarry ?? 0;
}

/**
 * Final total of a month. Works for all close formats: the oldest closes have neither credit
 * carry nor credit round-up, so their adjustment applies to the combined total exactly as
 * before; closes from the automatic-carry period only have a credit carry.
 */
export function applyClose(raw: number, close: MonthClose | undefined): number {
  if (close === undefined) {
    return raw;
  }
  const creditTotal = raw - (close.creditCarry ?? 0) + (close.creditRoundUp ?? 0);
  switch (close.mode) {
    case 'roundUp':
      return creditTotal + close.adjustment;
    case 'carryOver':
      return creditTotal - close.adjustment;
    default:
      return creditTotal;
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

/** How the remainders of hours (entries) and credits are settled; chosen independently. */
export interface CloseChoices {
  entries: CloseChoice;
  credits: CloseChoice;
}

/** Minutes below the next full hour, 0 when the value already ends on a full hour. */
export function hourRemainder(minutes: number): number {
  return minutes % MINUTES_PER_HOUR;
}

function settleEntries(entryRaw: number, choice: CloseChoice) {
  const remainder = hourRemainder(entryRaw);
  if (remainder === 0) {
    return { mode: 'none' as const, adjustment: 0 };
  }
  return choice === 'roundUp'
    ? { mode: 'roundUp' as const, adjustment: MINUTES_PER_HOUR - remainder }
    : { mode: 'carryOver' as const, adjustment: remainder };
}

function settleCredits(creditRaw: number, choice: CloseChoice) {
  const remainder = hourRemainder(creditRaw);
  if (remainder === 0) {
    return { creditCarry: 0 };
  }
  return choice === 'roundUp'
    ? { creditCarry: 0, creditRoundUp: MINUTES_PER_HOUR - remainder }
    : { creditCarry: remainder };
}

/**
 * Builds the close record. Hours and credits are settled separately, each by its own choice
 * to round up to the next full hour or to carry the remainder into the next month.
 */
export function buildClose(
  month: MonthKey,
  entryRaw: number,
  creditRaw: number,
  choices: CloseChoices,
): MonthClose {
  return {
    month,
    ...settleEntries(entryRaw, choices.entries),
    ...settleCredits(creditRaw, choices.credits),
  };
}

/** Which parts need a decision: only those that do not end on a full hour. */
export function closeChoicesNeeded(entryRaw: number, creditRaw: number) {
  return { entries: hourRemainder(entryRaw) !== 0, credits: hourRemainder(creditRaw) !== 0 };
}

/** True when the user has to decide something; otherwise the month closes right away. */
export function needsCloseChoice(entryRaw: number, creditRaw: number): boolean {
  const needed = closeChoicesNeeded(entryRaw, creditRaw);
  return needed.entries || needed.credits;
}

/** Whether closing with this record moves any minutes into the next month. */
export function carriesIntoNextMonth(close: MonthClose): boolean {
  return close.mode === 'carryOver' || (close.creditCarry ?? 0) > 0;
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
