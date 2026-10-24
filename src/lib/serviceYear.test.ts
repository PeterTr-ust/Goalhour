import { describe, expect, it } from 'vitest';
import { monthKeyOf } from './calendar';
import { formatServiceYear, serviceYearMonths, serviceYearOf } from './serviceYear';

describe('serviceYearOf', () => {
  it('assigns September to December to the year they start in', () => {
    expect(serviceYearOf('2025-10')).toBe(2025);
    expect(serviceYearOf('2025-12')).toBe(2025);
  });

  it('assigns January to August to the previous start year', () => {
    expect(serviceYearOf('2026-02')).toBe(2025);
  });

  it('splits at 31 August / 1 September', () => {
    expect(serviceYearOf(monthKeyOf('2026-08-31'))).toBe(2025);
    expect(serviceYearOf(monthKeyOf('2026-09-01'))).toBe(2026);
  });
});

describe('serviceYearMonths', () => {
  it('lists September to August', () => {
    const months = serviceYearMonths(2025);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-09');
    expect(months[3]).toBe('2025-12');
    expect(months[4]).toBe('2026-01');
    expect(months[11]).toBe('2026-08');
  });
});

describe('formatServiceYear', () => {
  it('formats as start/short end year', () => {
    expect(formatServiceYear(2025)).toBe('2025/26');
    expect(formatServiceYear(2099)).toBe('2099/00');
  });
});
