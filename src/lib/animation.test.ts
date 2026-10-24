import { describe, expect, it } from 'vitest';
import { easeOutCubic, interpolate } from './animation';

describe('easeOutCubic', () => {
  it('starts at 0, ends at 1 and clamps outside values', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });

  it('moves faster at the start than at the end', () => {
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });
});

describe('interpolate', () => {
  it('moves between both values in either direction', () => {
    expect(interpolate(0, 100, 0)).toBe(0);
    expect(interpolate(0, 100, 1)).toBe(100);
    expect(interpolate(100, 0, 0.5)).toBeCloseTo(12.5);
  });
});
