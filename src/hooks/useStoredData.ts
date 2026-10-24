import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { MonthData } from '../lib/month';
import type { YearGoal } from '../lib/types';

export interface StoredData extends MonthData {
  yearGoals: YearGoal[];
  /** Epoch milliseconds of the last backup, undefined if there was none. */
  lastBackupAt: number | undefined;
}

/** All stored data, kept up to date with the database. Undefined while loading. */
export function useStoredData(): StoredData | undefined {
  return useLiveQuery(async () => {
    const [items, goals, closes, yearGoals, lastBackup] = await Promise.all([
      db.items.toArray(),
      db.goals.toArray(),
      db.closes.toArray(),
      db.yearGoals.toArray(),
      db.meta.get('lastBackupAt'),
    ]);
    return { items, goals, closes, yearGoals, lastBackupAt: lastBackup?.value };
  });
}
