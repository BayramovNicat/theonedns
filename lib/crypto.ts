import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not set');
  if (key.length !== 64)
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
    );
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== 32)
    throw new Error('CREDENTIALS_ENCRYPTION_KEY contains non-hex characters');
  return buf;
}

export function encrypt(data: Record<string, string>): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encoded: string): Record<string, string> {
  if (encoded.startsWith('{')) {
    throw new Error(
      'Plaintext credentials detected. Re-save this project to encrypt them.',
    );
  }

  const key = getKey();
  const [ivHex, tagHex, ciphertextHex] = encoded.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}
