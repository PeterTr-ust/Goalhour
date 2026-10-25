import { describe, expect, it } from 'vitest';
import { parseBackup } from './backup';
import { decryptBackupText, isEncryptedBackup } from './backupCrypto';
import { summarizeMonth } from './month';
import { summarizeServiceYear } from './serviceYear';

/**
 * Frozen backups in older formats. These must keep importing and produce the same totals
 * forever: they are the only way users can restore or move their data. Never edit these
 * samples; add a new one when the format changes.
 */

/** Format version 1, exported before credits were settled separately (October 2026). */
const BACKUP_V1_COMBINED_SETTLEMENT = `{
  "app": "goalhour",
  "version": 1,
  "exportedAt": 1793000000000,
  "items": [
    { "id": "s1", "type": "entry", "date": "2026-09-05", "time": "10:00", "minutes": 3000, "createdAt": 1 },
    { "id": "s2", "type": "credit", "date": "2026-09-20", "minutes": 150, "createdAt": 2 },
    { "id": "o1", "type": "entry", "date": "2026-10-03", "time": "09:15", "minutes": 600, "createdAt": 3 },
    { "id": "n1", "type": "entry", "date": "2026-11-02", "minutes": 45, "createdAt": 4 }
  ],
  "goals": [{ "month": "2026-09", "minutes": 3000 }],
  "yearGoals": [{ "startYear": 2026, "minutes": 36000 }],
  "closes": [
    { "month": "2026-09", "mode": "carryOver", "adjustment": 30 },
    { "month": "2026-10", "mode": "roundUp", "adjustment": 30 }
  ]
}`;

/**
 * Encrypted backup, envelope version 1, around a plain format 4 backup. Produced by an
 * independent script with a fixed salt and IV. Invented password, for tests only.
 */
const ENCRYPTED_V1_PASSWORD = 'erfundenes-Test-Passwort';
const ENCRYPTED_V1 = `{"app":"goalhour","encrypted":1,"kdf":{"name":"PBKDF2","hash":"SHA-256","iterations":100000,"salt":"AQIDBAUGBwgJCgsMDQ4PEA=="},"cipher":{"name":"AES-GCM","iv":"ZGVmZ2hpamtsbW5v"},"data":"dsJ8x+osV+7ZKHhDT/5RwgUIQtR4DBYOPUr/sfxuq7P5VgEjfkQRk29J0nwgym+nAAcr7yuln0yiAytfcp169C2yV68Qj5cGIZFH4QJffd1ZHW6nMXo8UGsMVKMoL27ih2lLT/36dMpWpr8YMwu5MUTR5PuWfciZFCJcILq/Vhj4Ka/ksNEd8agQF/EBea+Ze3zdngbaU+1Tt/DzJhlciIi9MpaPpWWqDy6WeCv0AkZBs79Lz4vOeR2U8bnlzHqQ66npVyWFpgy+/iTmOG7d5IkQ++WrFyhtpc3Dl/2L7ciNKs+bAye6S5UMKFXDtwWpoMX6AhpEITru6fVVuRzYYSjUu7ojpUC55uCzZ0KgWMpSYgD2sf1bl4Xf3OlYGp9f5czasmbDmcklU60J5EhAiPfYY0tVcSA5BDW6oY/pJwgs8kMZBHdhttLF6cRyNsutcYsJHKUuo6DVoD4rofgzzTTbDQir"}`;

describe('encrypted backup, envelope version 1', () => {
  it('decrypts and keeps the totals', async () => {
    expect(isEncryptedBackup(ENCRYPTED_V1)).toBe(true);
    const decrypted = await decryptBackupText(ENCRYPTED_V1, ENCRYPTED_V1_PASSWORD);
    if (!decrypted.ok) {
      throw new Error(`Encrypted backup no longer decrypts: ${decrypted.error}`);
    }
    const result = parseBackup(decrypted.text);
    if (!result.ok) {
      throw new Error(`Decrypted backup no longer parses: ${result.error}`);
    }
    // Hours 50:20 rounded up to 51:00, credits 2:30 -> 2:00 with 0:30 carried.
    expect(summarizeMonth('2026-09', result.backup).total).toBe(3180);
    expect(summarizeMonth('2026-10', result.backup).creditCarryIn).toBe(30);
  });
});

/** Format version 4: credits may be rounded up (`creditRoundUp`) instead of carried over. */
const BACKUP_V4_CREDIT_ROUND_UP = `{
  "app": "goalhour",
  "version": 4,
  "exportedAt": 1793300000000,
  "items": [
    { "id": "s1", "type": "entry", "date": "2026-09-05", "minutes": 3020, "createdAt": 1 },
    { "id": "s2", "type": "credit", "date": "2026-09-20", "minutes": 150, "createdAt": 2 },
    { "id": "o1", "type": "credit", "date": "2026-10-03", "minutes": 45, "createdAt": 3 }
  ],
  "goals": [],
  "yearGoals": [],
  "yearPlans": [],
  "closes": [
    { "month": "2026-09", "mode": "carryOver", "adjustment": 20, "creditCarry": 0, "creditRoundUp": 30 }
  ]
}`;

describe('backup format version 4 (credit round-up)', () => {
  it('keeps the credit round-up and the hours carry-over', () => {
    const result = parseBackup(BACKUP_V4_CREDIT_ROUND_UP);
    if (!result.ok) {
      throw new Error(`Backup no longer parses: ${result.error}`);
    }
    // September: hours 50:20 -> 50:00 (0:20 carried), credits 2:30 rounded up to 3:00.
    expect(summarizeMonth('2026-09', result.backup).total).toBe(3180);
    const october = summarizeMonth('2026-10', result.backup);
    expect(october.carryIn).toBe(20);
    expect(october.creditCarryIn).toBe(0);
    expect(october.total).toBe(65);
  });
});

/** Format version 3: adds planned weeks off per service year. */
const BACKUP_V3_YEAR_PLANS = `{
  "app": "goalhour",
  "version": 3,
  "exportedAt": 1793200000000,
  "items": [
    { "id": "s1", "type": "entry", "date": "2026-09-05", "minutes": 3000, "createdAt": 1 }
  ],
  "goals": [],
  "yearGoals": [{ "startYear": 2026, "minutes": 36000 }],
  "yearPlans": [{ "startYear": 2026, "weeksOff": 4 }],
  "closes": [{ "month": "2026-09", "mode": "none", "adjustment": 0, "creditCarry": 0 }]
}`;

describe('backup format version 3 (year plans)', () => {
  it('keeps the planned weeks off and the totals', () => {
    const result = parseBackup(BACKUP_V3_YEAR_PLANS);
    if (!result.ok) {
      throw new Error(`Backup no longer parses: ${result.error}`);
    }
    expect(result.backup.yearPlans).toEqual([{ startYear: 2026, weeksOff: 4 }]);
    expect(summarizeMonth('2026-09', result.backup).total).toBe(3000);
  });
});

/** Format version 2: credits settled separately, remainder carried in `creditCarry`. */
const BACKUP_V2_SEPARATE_CREDITS = `{
  "app": "goalhour",
  "version": 2,
  "exportedAt": 1793100000000,
  "items": [
    { "id": "s1", "type": "entry", "date": "2026-09-05", "time": "10:00", "minutes": 3020, "createdAt": 1 },
    { "id": "s2", "type": "credit", "date": "2026-09-20", "minutes": 150, "createdAt": 2 },
    { "id": "o1", "type": "credit", "date": "2026-10-03", "minutes": 45, "createdAt": 3 }
  ],
  "goals": [{ "month": "2026-09", "minutes": 3000 }],
  "yearGoals": [],
  "closes": [
    { "month": "2026-09", "mode": "roundUp", "adjustment": 40, "creditCarry": 30 }
  ]
}`;

describe('backup format version 2 (separate credit settlement)', () => {
  const result = parseBackup(BACKUP_V2_SEPARATE_CREDITS);
  if (!result.ok) {
    throw new Error(`Backup no longer parses: ${result.error}`);
  }
  const data = result.backup;

  it('keeps the totals and the credit carry-over', () => {
    // September: entries 50:20 rounded up to 51:00, credits 2:30 -> 2:00.
    expect(summarizeMonth('2026-09', data).total).toBe(3180);
    // October: credits 0:45 + 0:30 carried = 1:15, still open.
    const october = summarizeMonth('2026-10', data);
    expect(october.creditCarryIn).toBe(30);
    expect(october.total).toBe(75);
  });
});

describe('backup format version 1 (combined settlement)', () => {
  const result = parseBackup(BACKUP_V1_COMBINED_SETTLEMENT);
  if (!result.ok) {
    throw new Error(`Old backup no longer parses: ${result.error}`);
  }
  const data = result.backup;

  it('still imports completely', () => {
    expect(data.items).toHaveLength(4);
    expect(data.closes).toHaveLength(2);
    expect(data.yearGoals).toEqual([{ startYear: 2026, minutes: 36000 }]);
    // Added in format 3; missing in older backups.
    expect(data.yearPlans).toEqual([]);
  });

  it('keeps the totals of months closed with the old combined rule', () => {
    // September: 50:00 + 2:30 = 52:30, 0:30 carried over as a whole.
    expect(summarizeMonth('2026-09', data).total).toBe(3120);
    // October: 10:00 + 0:30 carried in = 10:30, rounded up to 11:00.
    const october = summarizeMonth('2026-10', data);
    expect(october.carryIn).toBe(30);
    expect(october.total).toBe(660);
    // November: open, no carry-in after a round-up.
    const november = summarizeMonth('2026-11', data);
    expect(november.carryIn).toBe(0);
    expect(november.total).toBe(45);
  });

  it('keeps the service year total', () => {
    expect(summarizeServiceYear(2026, data).total).toBe(3120 + 660 + 45);
  });
});
