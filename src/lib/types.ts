/** Calendar month in the form "YYYY-MM". */
export type MonthKey = string;

/** Calendar date in the form "YYYY-MM-DD". */
export type IsoDate = string;

export type ItemType = 'entry' | 'credit';

export interface Item {
  id: string;
  type: ItemType;
  date: IsoDate;
  /** "HH:mm", only set for entries. */
  time?: string;
  minutes: number;
  createdAt: number;
}

export interface MonthGoal {
  month: MonthKey;
  minutes: number;
}

export interface YearGoal {
  /** Calendar year in which the service year starts (September). */
  startYear: number;
  minutes: number;
}

/** Planning input for one service year; not inherited by later years. */
export interface YearPlan {
  startYear: number;
  /** Planned weeks without service (0..51). */
  weeksOff: number;
}

export type CloseMode = 'roundUp' | 'carryOver' | 'none';

export interface MonthClose {
  month: MonthKey;
  /** How the remainder of the entries (plus their carry-in) was settled. */
  mode: CloseMode;
  /** Minutes added (roundUp) or moved to the next month (carryOver). */
  adjustment: number;
  /**
   * Remainder of the credits (plus their carry-in) moved to the next month's credits.
   * Missing on months closed before credits were settled separately: there `mode` and
   * `adjustment` apply to the combined total, and those totals must stay unchanged.
   */
  creditCarry?: number;
}
