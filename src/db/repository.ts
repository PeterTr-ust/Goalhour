import { monthKeyOf, nextMonth } from '../lib/calendar';
import { buildClose, canCarryOver, summarizeMonth, type CloseChoice } from '../lib/month';
import type { BackupFile } from '../lib/backup';
import type { Item, MonthClose, MonthKey } from '../lib/types';
import { db } from './database';

export type RepositoryErrorCode = 'monthClosed' | 'nextMonthClosed';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode) {
    super(code);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

export type NewItem = Omit<Item, 'id' | 'createdAt'>;

async function assertMonthOpen(month: MonthKey): Promise<void> {
  if ((await db.closes.get(month)) !== undefined) {
    throw new RepositoryError('monthClosed');
  }
}

export async function addItem(input: NewItem): Promise<void> {
  await db.transaction('rw', db.items, db.closes, async () => {
    await assertMonthOpen(monthKeyOf(input.date));
    await db.items.add({ ...input, id: crypto.randomUUID(), createdAt: Date.now() });
  });
}

export async function updateItem(id: string, input: NewItem): Promise<void> {
  await db.transaction('rw', db.items, db.closes, async () => {
    const existing = await db.items.get(id);
    if (existing === undefined) {
      throw new Error(`Item ${id} not found`);
    }
    await assertMonthOpen(monthKeyOf(existing.date));
    await assertMonthOpen(monthKeyOf(input.date));
    // Replace the whole record so that a removed `time` does not linger.
    await db.items.put({ id, createdAt: existing.createdAt, ...input });
  });
}

/** Deletes an item and returns it, so the deletion can be undone. */
export async function deleteItem(id: string): Promise<Item | undefined> {
  return db.transaction('rw', db.items, db.closes, async () => {
    const existing = await db.items.get(id);
    if (existing === undefined) {
      return undefined;
    }
    await assertMonthOpen(monthKeyOf(existing.date));
    await db.items.delete(id);
    return existing;
  });
}

/** Puts a previously deleted item back unchanged (undo). */
export async function restoreItem(item: Item): Promise<void> {
  await db.transaction('rw', db.items, db.closes, async () => {
    await assertMonthOpen(monthKeyOf(item.date));
    await db.items.put(item);
  });
}

export async function setGoal(month: MonthKey, minutes: number): Promise<void> {
  await db.goals.put({ month, minutes });
}

export async function setYearGoal(startYear: number, minutes: number): Promise<void> {
  await db.yearGoals.put({ startYear, minutes });
}

/** Replaces all stored data with the content of a validated backup, all or nothing. */
export async function replaceAllData(backup: BackupFile): Promise<void> {
  await db.transaction('rw', [db.items, db.goals, db.yearGoals, db.closes, db.meta], async () => {
    await Promise.all([
      db.items.clear(),
      db.goals.clear(),
      db.yearGoals.clear(),
      db.closes.clear(),
    ]);
    await Promise.all([
      db.items.bulkAdd(backup.items),
      db.goals.bulkAdd(backup.goals),
      db.yearGoals.bulkAdd(backup.yearGoals),
      db.closes.bulkAdd(backup.closes),
    ]);
    // The restored data is exactly what the backup contains.
    await db.meta.put({ key: 'lastBackupAt', value: backup.exportedAt });
  });
}

export async function markBackupDone(timestamp: number): Promise<void> {
  await db.meta.put({ key: 'lastBackupAt', value: timestamp });
}

/** Closes a month, computing the adjustment from the current stored data. */
export async function closeMonth(month: MonthKey, choice: CloseChoice): Promise<MonthClose> {
  return db.transaction('rw', db.items, db.goals, db.closes, async () => {
    await assertMonthOpen(month);
    const [items, goals, closes] = await Promise.all([
      db.items.toArray(),
      db.goals.toArray(),
      db.closes.toArray(),
    ]);
    const { entryRaw, creditRaw } = summarizeMonth(month, { items, goals, closes });
    const close = buildClose(month, entryRaw, creditRaw, choice);
    // Anything carried into an already closed next month would silently change it.
    const carriesMinutes = close.mode === 'carryOver' || (close.creditCarry ?? 0) > 0;
    if (carriesMinutes && !canCarryOver(closes, month)) {
      throw new RepositoryError('nextMonthClosed');
    }
    await db.closes.put(close);
    return close;
  });
}

export async function reopenMonth(month: MonthKey): Promise<void> {
  await db.transaction('rw', db.closes, async () => {
    if ((await db.closes.get(nextMonth(month))) !== undefined) {
      throw new RepositoryError('nextMonthClosed');
    }
    await db.closes.delete(month);
  });
}

/** Asks the browser to keep the data even under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) {
    return false;
  }
  if (await navigator.storage.persisted()) {
    return true;
  }
  return navigator.storage.persist();
}
