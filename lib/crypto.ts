import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'sih-7th-member-super-secret-key-32chars!';
  // Hash the secret with SHA-256 to guarantee a 32-byte key
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Output format: base64(iv + authTag + encryptedData)
 */
export function encryptKey(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine IV (12 bytes) + Tag (16 bytes) + Encrypted Data
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt a base64 string encrypted with AES-256-GCM.
 */
export function decryptKey(encryptedBase64: string): string {
  if (!encryptedBase64) return '';
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encryptedBase64, 'base64');

    if (buffer.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid encrypted payload length');
    }

    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encryptedText = buffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Failed to decrypt key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Masks an API key for safe display in UI (e.g. gsk_abc...xyz)
 */
export function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
