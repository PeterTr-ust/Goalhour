import { MAX_MINUTE_FIELD } from './duration';
import type { CloseMode, Item, MonthClose, MonthGoal, YearGoal } from './types';

export const BACKUP_APP_ID = 'goalhour';
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_REMINDER_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLOSE_MODES: readonly CloseMode[] = ['roundUp', 'carryOver', 'none'];

export interface BackupContent {
  items: Item[];
  goals: MonthGoal[];
  yearGoals: YearGoal[];
  closes: MonthClose[];
}

export interface BackupFile extends BackupContent {
  app: typeof BACKUP_APP_ID;
  version: number;
  /** Epoch milliseconds. */
  exportedAt: number;
}

export function createBackup(content: BackupContent, now: number): BackupFile {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: now,
    items: content.items,
    goals: content.goals,
    yearGoals: content.yearGoals,
    closes: content.closes,
  };
}

export function backupFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `goalhour-backup-${date}.json`;
}

export type BackupError = 'invalidJson' | 'notABackup' | 'unsupportedVersion' | 'invalidData';

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: BackupError };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isString(value: unknown, pattern?: RegExp): value is string {
  return typeof value === 'string' && (pattern === undefined || pattern.test(value));
}

function parseItem(value: unknown): Item | null {
  if (!isRecord(value)) {
    return null;
  }
  const { id, type, date, time, minutes, createdAt } = value;
  if (
    !isString(id) ||
    id === '' ||
    (type !== 'entry' && type !== 'credit') ||
    !isString(date, DATE_PATTERN) ||
    !isPositiveInteger(minutes) ||
    !isNonNegativeInteger(createdAt)
  ) {
    return null;
  }
  if (time === undefined) {
    return { id, type, date, minutes, createdAt };
  }
  return isString(time, TIME_PATTERN) ? { id, type, date, time, minutes, createdAt } : null;
}

function parseGoal(value: unknown): MonthGoal | null {
  if (!isRecord(value) || !isString(value.month, MONTH_PATTERN)) {
    return null;
  }
  return isNonNegativeInteger(value.minutes)
    ? { month: value.month, minutes: value.minutes }
    : null;
}

function parseYearGoal(value: unknown): YearGoal | null {
  if (!isRecord(value) || !isNonNegativeInteger(value.startYear)) {
    return null;
  }
  return isNonNegativeInteger(value.minutes)
    ? { startYear: value.startYear, minutes: value.minutes }
    : null;
}

function parseClose(value: unknown): MonthClose | null {
  if (!isRecord(value) || !isString(value.month, MONTH_PATTERN)) {
    return null;
  }
  const { mode, adjustment } = value;
  if (!CLOSE_MODES.includes(mode as CloseMode) || !isNonNegativeInteger(adjustment)) {
    return null;
  }
  if (adjustment > MAX_MINUTE_FIELD) {
    return null;
  }
  return { month: value.month, mode: mode as CloseMode, adjustment };
}

/** Parses every entry of a list, or returns null if the list or any entry is invalid. */
function parseList<T>(value: unknown, parse: (entry: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const parsed: T[] = [];
  for (const entry of value) {
    const result = parse(entry);
    if (result === null) {
      return null;
    }
    parsed.push(result);
  }
  return parsed;
}

function hasUniqueKeys<T>(list: readonly T[], key: (entry: T) => string | number): boolean {
  return new Set(list.map(key)).size === list.length;
}

/** Validates the text of a backup file. Never trusts the content. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalidJson' };
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP_ID) {
    return { ok: false, error: 'notABackup' };
  }
  if (raw.version !== BACKUP_FORMAT_VERSION) {
    return { ok: false, error: 'unsupportedVersion' };
  }

  const items = parseList(raw.items, parseItem);
  const goals = parseList(raw.goals, parseGoal);
  const yearGoals = parseList(raw.yearGoals ?? [], parseYearGoal);
  const closes = parseList(raw.closes, parseClose);
  if (
    !isNonNegativeInteger(raw.exportedAt) ||
    items === null ||
    goals === null ||
    yearGoals === null ||
    closes === null ||
    !hasUniqueKeys(items, (item) => item.id) ||
    !hasUniqueKeys(goals, (goal) => goal.month) ||
    !hasUniqueKeys(yearGoals, (goal) => goal.startYear) ||
    !hasUniqueKeys(closes, (close) => close.month)
  ) {
    return { ok: false, error: 'invalidData' };
  }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP_ID,
      version: BACKUP_FORMAT_VERSION,
      exportedAt: raw.exportedAt,
      items,
      goals,
      yearGoals,
      closes,
    },
  };
}

/** True when there is data worth saving and no backup in the last {@link BACKUP_REMINDER_DAYS}. */
export function needsBackupReminder(
  lastBackupAt: number | undefined,
  itemCount: number,
  now: number,
): boolean {
  if (itemCount === 0) {
    return false;
  }
  if (lastBackupAt === undefined) {
    return true;
  }
  return now - lastBackupAt >= BACKUP_REMINDER_DAYS * MS_PER_DAY;
}

/** Whole days since the last backup, or undefined if there was none. */
export function daysSince(timestamp: number | undefined, now: number): number | undefined {
  return timestamp === undefined ? undefined : Math.floor((now - timestamp) / MS_PER_DAY);
}
