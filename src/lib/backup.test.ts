import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  createBackup,
  daysSince,
  needsBackupReminder,
  parseBackup,
  type BackupContent,
} from './backup';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 24, 12);

const content: BackupContent = {
  items: [
    { id: 'a', type: 'entry', date: '2026-10-02', time: '09:30', minutes: 90, createdAt: 1 },
    { id: 'b', type: 'credit', date: '2026-10-05', minutes: 30, createdAt: 2 },
  ],
  goals: [{ month: '2026-09', minutes: 3000 }],
  yearGoals: [{ startYear: 2026, minutes: 36000 }],
  closes: [{ month: '2026-09', mode: 'carryOver', adjustment: 15 }],
};

function roundTrip(overrides: Record<string, unknown>) {
  return parseBackup(JSON.stringify({ ...createBackup(content, NOW), ...overrides }));
}

describe('createBackup and parseBackup', () => {
  it('round-trips all data', () => {
    const text = JSON.stringify(createBackup(content, NOW));
    expect(parseBackup(text)).toEqual({
      ok: true,
      backup: { app: 'goalhour', version: 1, exportedAt: NOW, ...content },
    });
  });

  it('rejects text that is not JSON or not a Goalhour backup', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'invalidJson' });
    expect(parseBackup('[]')).toEqual({ ok: false, error: 'notABackup' });
    expect(roundTrip({ app: 'other' })).toEqual({ ok: false, error: 'notABackup' });
  });

  it('rejects unknown format versions', () => {
    expect(roundTrip({ version: 2 })).toEqual({ ok: false, error: 'unsupportedVersion' });
  });

  it('accepts backups without year goals', () => {
    const result = roundTrip({ yearGoals: undefined });
    expect(result.ok && result.backup.yearGoals).toEqual([]);
  });

  it.each([
    ['a negative duration', { items: [{ ...content.items[0], minutes: -5 }] }],
    ['a zero duration', { items: [{ ...content.items[0], minutes: 0 }] }],
    ['an invalid date', { items: [{ ...content.items[0], date: '2026-13-01' }] }],
    ['an invalid time', { items: [{ ...content.items[0], time: '25:00' }] }],
    ['an unknown item type', { items: [{ ...content.items[0], type: 'bonus' }] }],
    ['duplicate item ids', { items: [content.items[0], content.items[0]] }],
    ['an invalid goal month', { goals: [{ month: '2026-9', minutes: 60 }] }],
    ['an unknown close mode', { closes: [{ month: '2026-09', mode: 'skip', adjustment: 0 }] }],
    [
      'a close adjustment of 60',
      { closes: [{ month: '2026-09', mode: 'roundUp', adjustment: 60 }] },
    ],
    ['missing lists', { items: undefined }],
    ['a missing export time', { exportedAt: 'yesterday' }],
  ])('rejects %s', (_, overrides) => {
    expect(roundTrip(overrides)).toEqual({ ok: false, error: 'invalidData' });
  });
});

describe('backupFileName', () => {
  it('contains the local date', () => {
    expect(backupFileName(new Date(2026, 9, 4))).toBe('goalhour-backup-2026-10-04.json');
  });
});

describe('needsBackupReminder', () => {
  it('stays quiet without data', () => {
    expect(needsBackupReminder(undefined, 0, NOW)).toBe(false);
  });

  it('reminds when there was never a backup', () => {
    expect(needsBackupReminder(undefined, 3, NOW)).toBe(true);
  });

  it('reminds after 14 days', () => {
    expect(needsBackupReminder(NOW - 13 * DAY, 3, NOW)).toBe(false);
    expect(needsBackupReminder(NOW - 14 * DAY, 3, NOW)).toBe(true);
  });
});

describe('daysSince', () => {
  it('counts whole days', () => {
    expect(daysSince(NOW - 15.5 * DAY, NOW)).toBe(15);
    expect(daysSince(undefined, NOW)).toBeUndefined();
  });
});
