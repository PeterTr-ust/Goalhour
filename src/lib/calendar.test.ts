import { describe, expect, it } from 'vitest';
import { addMonths, defaultDateForMonth, monthKeyOf, nextMonth, previousMonth } from './calendar';

describe('monthKeyOf', () => {
  it('extracts the month from an ISO date', () => {
    expect(monthKeyOf('2026-10-23')).toBe('2026-10');
  });
});

describe('addMonths', () => {
  it('crosses year boundaries in both directions', () => {
    expect(nextMonth('2026-12')).toBe('2027-01');
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(addMonths('2025-09', 11)).toBe('2026-08');
    expect(addMonths('2026-03', -15)).toBe('2024-12');
  });
});

describe('defaultDateForMonth', () => {
  const now = new Date(2026, 9, 24, 14, 30);

  it('uses today when the shown month is the current one', () => {
    expect(defaultDateForMonth('2026-10', now)).toBe('2026-10-24');
  });

  it('uses the first day of another month', () => {
    expect(defaultDateForMonth('2026-08', now)).toBe('2026-08-01');
  });
});
