import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { MonthData } from '../lib/month';
import type { YearGoal, YearPlan } from '../lib/types';

export interface StoredData extends MonthData {
  yearGoals: YearGoal[];
  yearPlans: YearPlan[];
  /** Epoch milliseconds of the last backup, undefined if there was none. */
  lastBackupAt: number | undefined;
}

/** All stored data, kept up to date with the database. Undefined while loading. */
export function useStoredData(): StoredData | undefined {
  return useLiveQuery(async () => {
    const [items, goals, closes, yearGoals, yearPlans, lastBackup] = await Promise.all([
      db.items.toArray(),
      db.goals.toArray(),
      db.closes.toArray(),
      db.yearGoals.toArray(),
      db.yearPlans.toArray(),
      db.meta.get('lastBackupAt'),
    ]);
    return { items, goals, closes, yearGoals, yearPlans, lastBackupAt: lastBackup?.value };
  });
}
