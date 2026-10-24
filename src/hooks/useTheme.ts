import { useCallback, useEffect, useState } from 'react';
import { parseThemePreference, THEME_STORAGE_KEY, type ThemePreference } from '../lib/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const THEME_COLORS = { light: '#ffffff', dark: '#000000' } as const;

function readPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Storage can be unavailable (e.g. private mode); fall back to the system theme.
    return 'system';
  }
}

function writePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch (error) {
    console.error(error);
  }
}

function applyTheme(preference: ThemePreference, systemDark: boolean): void {
  const resolved = preference === 'dark' || (preference === 'system' && systemDark);
  const theme = resolved ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  // Both theme-color tags (light/dark media) follow the chosen theme.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', THEME_COLORS[theme]);
  }
}

/** Theme preference of this device, applied to the document and kept in local storage. */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const update = () => applyTheme(preference, query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    writePreference(next);
    setPreferenceState(next);
  }, []);

  return { preference, setPreference };
}
