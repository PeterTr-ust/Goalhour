import { Dexie, type EntityTable } from 'dexie';
import type { Item, MonthClose, MonthGoal } from '../lib/types';

const DATABASE_NAME = 'goalhour';
const SCHEMA_VERSION = 1;

export class GoalhourDatabase extends Dexie {
  items!: EntityTable<Item, 'id'>;
  goals!: EntityTable<MonthGoal, 'month'>;
  closes!: EntityTable<MonthClose, 'month'>;

  constructor() {
    super(DATABASE_NAME);
    this.version(SCHEMA_VERSION).stores({
      items: 'id, date, type',
      goals: 'month',
      closes: 'month',
    });
  }
}

export const db = new GoalhourDatabase();
