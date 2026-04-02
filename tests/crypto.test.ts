import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { decrypt, encrypt } from '../lib/crypto';

// 64 hex chars = 32 bytes valid key
const VALID_KEY = 'a'.repeat(64);

beforeEach(() => {
  process.env.CREDENTIALS_ENCRYPTION_KEY = VALID_KEY;
});

afterEach(() => {
  delete process.env.CREDENTIALS_ENCRYPTION_KEY;
});

describe('encrypt', () => {
  it('returns a string in iv:tag:ciphertext format', () => {
    const result = encrypt({ api_token: 'secret' });
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    // IV = 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // ciphertext is non-empty hex
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encrypt({ key: 'value' });
    const b = encrypt({ key: 'value' });
    expect(a).not.toBe(b);
  });

  it('throws when CREDENTIALS_ENCRYPTION_KEY is not set', () => {
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    expect(() => encrypt({ x: '1' })).toThrow(
      'CREDENTIALS_ENCRYPTION_KEY is not set',
    );
  });

  it('throws when key is wrong length', () => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = 'short';
    expect(() => encrypt({ x: '1' })).toThrow('64 hex characters');
  });
});

describe('decrypt', () => {
  it('round-trips data through encrypt then decrypt', () => {
    const original = { api_token: 'super-secret', zone_id: 'abc123' };
    const encoded = encrypt(original);
    const decoded = decrypt(encoded);
    expect(decoded).toEqual(original);
  });

  it('handles credentials with special characters', () => {
    const original = { key: 'value with spaces & symbols: <test>' };
    expect(decrypt(encrypt(original))).toEqual(original);
  });

  it('handles empty object', () => {
    expect(decrypt(encrypt({}))).toEqual({});
  });

  it('throws on plaintext JSON input (legacy detection)', () => {
    expect(() => decrypt('{"api_token":"plain"}')).toThrow(
      'Plaintext credentials detected',
    );
  });

  it('throws when key is not set', () => {
    const encoded = encrypt({ x: '1' });
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    expect(() => decrypt(encoded)).toThrow(
      'CREDENTIALS_ENCRYPTION_KEY is not set',
    );
  });

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const encoded = encrypt({ x: '1' });
    const parts = encoded.split(':');
    // Corrupt the ciphertext
    parts[2] = `${parts[2].slice(0, -2)}ff`;
    expect(() => decrypt(parts.join(':'))).toThrow();
  });
});
