import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatSignedDuration,
  isWholeHour,
  splitMinutes,
  toMinutes,
  validateDuration,
  validateGoal,
} from './duration';

describe('formatDuration', () => {
  it('pads minutes to two digits', () => {
    expect(formatDuration(725)).toBe('12:05');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(3150)).toBe('52:30');
  });

  it('prefixes negative values with a minus sign', () => {
    expect(formatDuration(-90)).toBe('−1:30');
  });
});

describe('formatSignedDuration', () => {
  it('adds a plus sign to positive values', () => {
    expect(formatSignedDuration(150)).toBe('+2:30');
    expect(formatSignedDuration(-1050)).toBe('−17:30');
    expect(formatSignedDuration(0)).toBe('0:00');
  });
});

describe('splitMinutes and toMinutes', () => {
  it('round-trips hours and minutes', () => {
    expect(splitMinutes(75)).toEqual({ hours: 1, minutes: 15 });
    expect(toMinutes({ hours: 1, minutes: 15 })).toBe(75);
  });

  it('carries minutes into hours (0:45 + 0:30 = 1:15)', () => {
    const sum = toMinutes({ hours: 0, minutes: 45 }) + toMinutes({ hours: 0, minutes: 30 });
    expect(formatDuration(sum)).toBe('1:15');
  });
});

describe('isWholeHour', () => {
  it('detects full hours', () => {
    expect(isWholeHour(3000)).toBe(true);
    expect(isWholeHour(3150)).toBe(false);
  });
});

describe('validateDuration', () => {
  it('accepts valid durations', () => {
    expect(validateDuration({ hours: 0, minutes: 1 })).toBeNull();
    expect(validateDuration({ hours: 3, minutes: 59 })).toBeNull();
  });

  it('rejects out-of-range minutes', () => {
    expect(validateDuration({ hours: 1, minutes: 60 })).toBe('minutesOutOfRange');
    expect(validateDuration({ hours: 1, minutes: -1 })).toBe('minutesOutOfRange');
  });

  it('rejects negative hours, zero and non-integers', () => {
    expect(validateDuration({ hours: -1, minutes: 0 })).toBe('negativeHours');
    expect(validateDuration({ hours: 0, minutes: 0 })).toBe('zero');
    expect(validateDuration({ hours: Number.NaN, minutes: 0 })).toBe('invalidNumber');
    expect(validateDuration({ hours: 1.5, minutes: 0 })).toBe('invalidNumber');
  });
});

describe('validateGoal', () => {
  it('allows a goal of zero', () => {
    expect(validateGoal({ hours: 0, minutes: 0 })).toBeNull();
    expect(validateGoal({ hours: 0, minutes: 75 })).toBe('minutesOutOfRange');
  });
});
