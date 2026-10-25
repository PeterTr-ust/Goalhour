/**
 * Password protection for backup files: AES-256-GCM with a key derived from the password via
 * PBKDF2-SHA-256. The encrypted file is an envelope around the normal (plain) backup JSON, so
 * every plain backup format stays supported inside it. Uses only the built-in WebCrypto API.
 */

export const ENVELOPE_APP_ID = 'goalhour';
/** Version of the envelope itself (not of the backup inside it). */
export const ENVELOPE_VERSION = 1;
/**
 * The user picks how strong the password must be (default "full"). "full" resists targeted guessing of a
 * stolen file; "basic" only keeps out casual finders. Decryption accepts any length.
 */
export type ProtectionLevel = 'full' | 'basic';

export const PROTECTION_LEVELS: readonly ProtectionLevel[] = ['full', 'basic'];

export const MIN_PASSWORD_LENGTH: Record<ProtectionLevel, number> = {
  full: 8,
  basic: 4,
};

/** Current OWASP recommendation for PBKDF2-HMAC-SHA256. */
const DEFAULT_ITERATIONS = 600_000;
/** Bounds for iterations read from a file: weak files are rejected, huge ones cannot hang the app. */
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 10_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;

interface Envelope {
  app: typeof ENVELOPE_APP_ID;
  encrypted: typeof ENVELOPE_VERSION;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
  data: string;
}

export type DecryptError = 'wrongPassword' | 'invalidEnvelope';
export type DecryptResult = { ok: true; text: string } | { ok: false; error: DecryptError };

export type PasswordError = 'tooShort' | 'mismatch';

export function validateNewPassword(
  password: string,
  repeated: string,
  level: ProtectionLevel,
): PasswordError | null {
  if (password.length < MIN_PASSWORD_LENGTH[level]) {
    return 'tooShort';
  }
  return password === repeated ? null : 'mismatch';
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface EncryptOptions {
  iterations?: number;
}

/** Encrypts the plain backup text and returns the envelope as JSON text. */
export async function encryptBackupText(
  plainText: string,
  password: string,
  options: EncryptOptions = {},
): Promise<string> {
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, iterations);
  const cipherText = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText),
  );
  const envelope: Envelope = {
    app: ENVELOPE_APP_ID,
    encrypted: ENVELOPE_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(salt) },
    cipher: { name: 'AES-GCM', iv: toBase64(iv) },
    data: toBase64(new Uint8Array(cipherText)),
  };
  return JSON.stringify(envelope);
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when the file text is an encrypted backup (checked before asking for the password). */
export function isEncryptedBackup(text: string): boolean {
  try {
    const raw: unknown = JSON.parse(text);
    return isRecord(raw) && raw.app === ENVELOPE_APP_ID && raw.encrypted !== undefined;
  } catch {
    return false;
  }
}

interface ParsedEnvelope {
  iterations: number;
  salt: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  data: Uint8Array<ArrayBuffer>;
}

function parseEnvelope(text: string): ParsedEnvelope | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(raw) || raw.app !== ENVELOPE_APP_ID || raw.encrypted !== ENVELOPE_VERSION) {
    return null;
  }
  const { kdf, cipher, data } = raw;
  if (!isRecord(kdf) || !isRecord(cipher) || typeof data !== 'string') {
    return null;
  }
  const { iterations } = kdf;
  if (
    kdf.name !== 'PBKDF2' ||
    kdf.hash !== 'SHA-256' ||
    cipher.name !== 'AES-GCM' ||
    typeof iterations !== 'number' ||
    !Number.isInteger(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS ||
    typeof kdf.salt !== 'string' ||
    typeof cipher.iv !== 'string'
  ) {
    return null;
  }
  const salt = fromBase64(kdf.salt);
  const iv = fromBase64(cipher.iv);
  const bytes = fromBase64(data);
  if (salt?.length !== SALT_BYTES || iv?.length !== IV_BYTES || !bytes) {
    return null;
  }
  return { iterations, salt, iv, data: bytes };
}

/**
 * Decrypts an envelope. AES-GCM authenticates the content, so a wrong password and a changed
 * file both fail here and cannot be told apart.
 */
export async function decryptBackupText(text: string, password: string): Promise<DecryptResult> {
  const envelope = parseEnvelope(text);
  if (!envelope) {
    return { ok: false, error: 'invalidEnvelope' };
  }
  try {
    const key = await deriveKey(password, envelope.salt, envelope.iterations);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: envelope.iv },
      key,
      envelope.data,
    );
    return { ok: true, text: new TextDecoder().decode(plain) };
  } catch {
    return { ok: false, error: 'wrongPassword' };
  }
}
