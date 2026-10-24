import { describe, expect, it } from 'vitest';
import { parseThemePreference } from './theme';

describe('parseThemePreference', () => {
  it('accepts light and dark and falls back to system', () => {
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference('dark')).toBe('dark');
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('purple')).toBe('system');
  });
});
