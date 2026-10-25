import { MAX_MINUTE_FIELD } from './duration';
import { validateWeeksOff } from './plan';
import type { CloseMode, Item, MonthClose, MonthGoal, YearGoal, YearPlan } from './types';

export const BACKUP_APP_ID = 'goalhour';
/**
 * Current format written by the app. Every older version must stay importable.
 * 1: initial format. 2: closes may carry `creditCarry` (credits settled separately).
 * 3: adds `yearPlans` (planned weeks off per service year).
 * 4: closes may carry `creditRoundUp` (credits rounded up instead of carried over).
 */
export const BACKUP_FORMAT_VERSION = 4;
const SUPPORTED_VERSIONS: readonly number[] = [1, 2, 3, 4];
export const BACKUP_REMINDER_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLOSE_MODES: readonly CloseMode[] = ['roundUp', 'carryOver', 'none'];

export interface BackupContent {
  items: readonly Item[];
  goals: readonly MonthGoal[];
  yearGoals: readonly YearGoal[];
  yearPlans: readonly YearPlan[];
  closes: readonly MonthClose[];
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
    yearPlans: content.yearPlans,
    closes: content.closes,
  };
}

/**
 * Own extension so backups are recognisable and not opened by other apps; the content is
 * still JSON. Older backups ending in ".json" are imported the same way.
 */
export const BACKUP_FILE_EXTENSION = '.goalhour';

export function backupFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `goalhour-backup-${date}${BACKUP_FILE_EXTENSION}`;
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

/** 0..59: what can be left over below a full hour. */
function isMinuteRemainder(value: unknown): value is number {
  return isNonNegativeInteger(value) && value <= MAX_MINUTE_FIELD;
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

function parseYearPlan(value: unknown): YearPlan | null {
  if (!isRecord(value) || !isNonNegativeInteger(value.startYear)) {
    return null;
  }
  const { weeksOff } = value;
  return typeof weeksOff === 'number' && validateWeeksOff(weeksOff) === null
    ? { startYear: value.startYear, weeksOff }
    : null;
}

function parseClose(value: unknown): MonthClose | null {
  if (!isRecord(value) || !isString(value.month, MONTH_PATTERN)) {
    return null;
  }
  const { mode, adjustment, creditCarry, creditRoundUp } = value;
  if (!CLOSE_MODES.includes(mode as CloseMode) || !isMinuteRemainder(adjustment)) {
    return null;
  }
  // Optional fields stay absent when missing, so older closes keep their exact meaning.
  if (creditCarry !== undefined && !isMinuteRemainder(creditCarry)) {
    return null;
  }
  if (creditRoundUp !== undefined && !isMinuteRemainder(creditRoundUp)) {
    return null;
  }
  return {
    month: value.month,
    mode: mode as CloseMode,
    adjustment,
    ...(creditCarry === undefined ? {} : { creditCarry }),
    ...(creditRoundUp === undefined ? {} : { creditRoundUp }),
  };
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
  if (typeof raw.version !== 'number' || !SUPPORTED_VERSIONS.includes(raw.version)) {
    return { ok: false, error: 'unsupportedVersion' };
  }

  const items = parseList(raw.items, parseItem);
  const goals = parseList(raw.goals, parseGoal);
  // Lists added in later formats are optional, so older backups still import.
  const yearGoals = parseList(raw.yearGoals ?? [], parseYearGoal);
  const yearPlans = parseList(raw.yearPlans ?? [], parseYearPlan);
  const closes = parseList(raw.closes, parseClose);
  if (
    !isNonNegativeInteger(raw.exportedAt) ||
    items === null ||
    goals === null ||
    yearGoals === null ||
    yearPlans === null ||
    closes === null ||
    !hasUniqueKeys(items, (item) => item.id) ||
    !hasUniqueKeys(goals, (goal) => goal.month) ||
    !hasUniqueKeys(yearGoals, (goal) => goal.startYear) ||
    !hasUniqueKeys(yearPlans, (plan) => plan.startYear) ||
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
      yearPlans,
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
