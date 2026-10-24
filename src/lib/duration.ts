export const MINUTES_PER_HOUR = 60;
export const MAX_MINUTE_FIELD = MINUTES_PER_HOUR - 1;

const MINUTE_DIGITS = 2;

export interface HoursMinutes {
  hours: number;
  minutes: number;
}

export function splitMinutes(totalMinutes: number): HoursMinutes {
  const absolute = Math.abs(totalMinutes);
  return {
    hours: Math.floor(absolute / MINUTES_PER_HOUR),
    minutes: absolute % MINUTES_PER_HOUR,
  };
}

export function toMinutes({ hours, minutes }: HoursMinutes): number {
  return hours * MINUTES_PER_HOUR + minutes;
}

/** Formats minutes as "H:MM", e.g. 725 -> "12:05". Negative values get a leading minus. */
export function formatDuration(totalMinutes: number): string {
  const { hours, minutes } = splitMinutes(totalMinutes);
  const sign = totalMinutes < 0 ? '−' : '';
  return `${sign}${hours}:${String(minutes).padStart(MINUTE_DIGITS, '0')}`;
}

/** Formats minutes with an explicit sign, e.g. "+2:30" or "−17:30". Zero has no sign. */
export function formatSignedDuration(totalMinutes: number): string {
  if (totalMinutes > 0) {
    return `+${formatDuration(totalMinutes)}`;
  }
  return formatDuration(totalMinutes);
}

export function isWholeHour(totalMinutes: number): boolean {
  return totalMinutes % MINUTES_PER_HOUR === 0;
}

/** Raw text of the hour and minute input fields. */
export interface DurationInput {
  hours: string;
  minutes: string;
}

/** Parses input field text. Empty fields count as 0, other text becomes NaN. */
export function parseDurationInput({ hours, minutes }: DurationInput): HoursMinutes {
  const parse = (text: string) => (text.trim() === '' ? 0 : Number(text));
  return { hours: parse(hours), minutes: parse(minutes) };
}

export function toDurationInput(totalMinutes: number): DurationInput {
  const { hours, minutes } = splitMinutes(totalMinutes);
  return { hours: String(hours), minutes: String(minutes) };
}

export type DurationError = 'invalidNumber' | 'minutesOutOfRange' | 'negativeHours' | 'zero';

/** Validates a duration input. Hours must be >= 0, minutes 0..59 and the total > 0. */
export function validateDuration({ hours, minutes }: HoursMinutes): DurationError | null {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return 'invalidNumber';
  }
  if (hours < 0) {
    return 'negativeHours';
  }
  if (minutes < 0 || minutes > MAX_MINUTE_FIELD) {
    return 'minutesOutOfRange';
  }
  if (toMinutes({ hours, minutes }) === 0) {
    return 'zero';
  }
  return null;
}

/** Same rules as {@link validateDuration}, except that a goal of zero is allowed. */
export function validateGoal(value: HoursMinutes): DurationError | null {
  const error = validateDuration(value);
  return error === 'zero' ? null : error;
}
