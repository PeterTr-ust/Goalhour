import type { IsoDate, MonthKey } from './types';

const MONTHS_PER_YEAR = 12;
const FIRST_DAY_OF_MONTH = 1;
const DATE_PART_DIGITS = 2;
const YEAR_DIGITS = 4;

function pad(value: number, digits = DATE_PART_DIGITS): string {
  return String(value).padStart(digits, '0');
}

export function toMonthKey(year: number, month: number): MonthKey {
  return `${pad(year, YEAR_DIGITS)}-${pad(month)}`;
}

export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [yearPart, monthPart] = key.split('-');
  return { year: Number(yearPart), month: Number(monthPart) };
}

export function monthKeyOf(date: IsoDate): MonthKey {
  return date.slice(0, YEAR_DIGITS + 1 + DATE_PART_DIGITS);
}

export function addMonths(key: MonthKey, offset: number): MonthKey {
  const { year, month } = parseMonthKey(key);
  const zeroBasedIndex = year * MONTHS_PER_YEAR + (month - 1) + offset;
  return toMonthKey(
    Math.floor(zeroBasedIndex / MONTHS_PER_YEAR),
    (zeroBasedIndex % MONTHS_PER_YEAR) + 1,
  );
}

export function previousMonth(key: MonthKey): MonthKey {
  return addMonths(key, -1);
}

export function nextMonth(key: MonthKey): MonthKey {
  return addMonths(key, 1);
}

export function toIsoDate(date: Date): IsoDate {
  return `${toMonthKey(date.getFullYear(), date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Default date for a new item: today if the shown month is the current one, else its first day. */
export function defaultDateForMonth(shownMonth: MonthKey, now: Date): IsoDate {
  const today = toIsoDate(now);
  if (monthKeyOf(today) === shownMonth) {
    return today;
  }
  return `${shownMonth}-${pad(FIRST_DAY_OF_MONTH)}`;
}
