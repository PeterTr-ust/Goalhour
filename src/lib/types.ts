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

export type CloseMode = 'roundUp' | 'carryOver' | 'none';

export interface MonthClose {
  month: MonthKey;
  mode: CloseMode;
  /** Minutes added (roundUp) or moved to the next month (carryOver). */
  adjustment: number;
}
