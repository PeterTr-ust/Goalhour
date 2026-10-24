import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { MonthData } from '../lib/month';

/** All stored data, kept up to date with the database. Undefined while loading. */
export function useStoredData(): MonthData | undefined {
  return useLiveQuery(async () => {
    const [items, goals, closes] = await Promise.all([
      db.items.toArray(),
      db.goals.toArray(),
      db.closes.toArray(),
    ]);
    return { items, goals, closes };
  });
}
