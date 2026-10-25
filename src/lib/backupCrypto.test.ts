import { describe, expect, it } from 'vitest';
import {
  decryptBackupText,
  encryptBackupText,
  isEncryptedBackup,
  validateNewPassword,
} from './backupCrypto';

// Fewer iterations keep the tests fast; the app uses 600 000.
const FAST = { iterations: 100_000 };
const PLAIN = '{"app":"goalhour","version":4,"items":[]}';
// Invented test value, not a secret.
const PASSWORD = 'erfundenes-Passwort-1'; // gitleaks:allow

describe('encryptBackupText and decryptBackupText', () => {
  it('round-trips the backup text', async () => {
    const encrypted = await encryptBackupText(PLAIN, PASSWORD, FAST);
    expect(encrypted).not.toContain('items');
    expect(isEncryptedBackup(encrypted)).toBe(true);
    expect(await decryptBackupText(encrypted, PASSWORD)).toEqual({ ok: true, text: PLAIN });
  });

  it('uses a new salt and IV every time', async () => {
    const first = await encryptBackupText(PLAIN, PASSWORD, FAST);
    const second = await encryptBackupText(PLAIN, PASSWORD, FAST);
    expect(first).not.toBe(second);
  });

  it('rejects a wrong password', async () => {
    const encrypted = await encryptBackupText(PLAIN, PASSWORD, FAST);
    expect(await decryptBackupText(encrypted, 'falsches-Passwort')).toEqual({
      ok: false,
      error: 'wrongPassword',
    });
  });

  it('detects a changed file', async () => {
    const envelope = JSON.parse(await encryptBackupText(PLAIN, PASSWORD, FAST)) as {
      data: string;
    };
    const flipped = envelope.data.startsWith('A')
      ? `B${envelope.data.slice(1)}`
      : `A${envelope.data.slice(1)}`;
    const tampered = JSON.stringify({ ...envelope, data: flipped });
    expect((await decryptBackupText(tampered, PASSWORD)).ok).toBe(false);
  });

  it('rejects malformed envelopes before deriving a key', async () => {
    const valid = JSON.parse(await encryptBackupText(PLAIN, PASSWORD, FAST)) as Record<
      string,
      unknown
    >;
    const cases = [
      { ...valid, encrypted: 2 },
      { ...valid, kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 1000, salt: 'AAAA' } },
      { ...valid, kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 1e9, salt: 'AAAA' } },
      { ...valid, cipher: { name: 'AES-CBC', iv: 'AAAA' } },
      { ...valid, data: 42 },
    ];
    for (const envelope of cases) {
      expect(await decryptBackupText(JSON.stringify(envelope), PASSWORD)).toEqual({
        ok: false,
        error: 'invalidEnvelope',
      });
    }
    expect(await decryptBackupText('not json', PASSWORD)).toEqual({
      ok: false,
      error: 'invalidEnvelope',
    });
  });
});

describe('isEncryptedBackup', () => {
  it('tells encrypted from plain backups', () => {
    expect(isEncryptedBackup(PLAIN)).toBe(false);
    expect(isEncryptedBackup('not json')).toBe(false);
  });
});

describe('validateNewPassword', () => {
  it('requires 8 characters for full protection', () => {
    expect(validateNewPassword('abcdefg', 'abcdefg', 'full')).toBe('tooShort');
    expect(validateNewPassword('abcdefgh', 'abcdefgh', 'full')).toBeNull();
  });

  it('requires 4 characters for basic protection', () => {
    expect(validateNewPassword('abc', 'abc', 'basic')).toBe('tooShort');
    expect(validateNewPassword('abcd', 'abcd', 'basic')).toBeNull();
  });

  it('requires a matching repetition', () => {
    expect(validateNewPassword('lang-genug', 'lang-genuG', 'full')).toBe('mismatch');
    expect(validateNewPassword('kurz', 'Kurz', 'basic')).toBe('mismatch');
  });
});
