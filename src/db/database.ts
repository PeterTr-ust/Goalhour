import { Dexie, type EntityTable } from 'dexie';
import type { Item, MonthClose, MonthGoal, YearGoal } from '../lib/types';

const DATABASE_NAME = 'goalhour';

export type MetaKey = 'lastBackupAt';

export interface MetaEntry {
  key: MetaKey;
  value: number;
}

export class GoalhourDatabase extends Dexie {
  items!: EntityTable<Item, 'id'>;
  goals!: EntityTable<MonthGoal, 'month'>;
  closes!: EntityTable<MonthClose, 'month'>;
  yearGoals!: EntityTable<YearGoal, 'startYear'>;
  meta!: EntityTable<MetaEntry, 'key'>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      items: 'id, date, type',
      goals: 'month',
      closes: 'month',
    });
    // Version 2 only adds tables; existing data stays untouched.
    this.version(2).stores({
      yearGoals: 'startYear',
      meta: 'key',
    });
  }
}

export const db = new GoalhourDatabase();
