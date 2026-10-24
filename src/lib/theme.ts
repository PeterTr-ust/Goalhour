export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Keep in sync with the inline script in index.html, which applies the theme before paint. */
export const THEME_STORAGE_KEY = 'goalhour.theme';

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
