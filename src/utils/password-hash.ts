// Password hashing utility — PBKDF2 via Web Crypto API
// Uses per-password random salt + 100k iterations for brute-force resistance
// Backward compatible: verifyPassword handles both old SHA-256 and new PBKDF2 formats

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // bytes
const HASH_LENGTH = 32; // bytes (256 bits)
const LEGACY_SALT = 'shinko_v1_'; // Old fixed salt for backward compat

// Convert bytes to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex string to bytes (validates input)
function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Hash password with PBKDF2 + random salt. Returns 'pbkdf2:<salt>:<hash>' */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_LENGTH * 8
  );
  return `pbkdf2:${toHex(salt)}:${toHex(new Uint8Array(hashBuffer))}`;
}

/** Verify password against stored hash (supports both PBKDF2 and legacy SHA-256) */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2:')) {
    // New PBKDF2 format: 'pbkdf2:<salt_hex>:<hash_hex>'
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const salt = fromHex(parts[1]);
    const expectedHash = parts[2];
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      HASH_LENGTH * 8
    );
    return timingSafeEqual(toHex(new Uint8Array(hashBuffer)), expectedHash);
  }

  // Legacy SHA-256 format: plain hex string (64 chars)
  const data = new TextEncoder().encode(LEGACY_SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computed = toHex(new Uint8Array(hashBuffer));
  return timingSafeEqual(computed, storedHash);
}

/** Check if a hash is in legacy SHA-256 format (needs migration) */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith('pbkdf2:');
}
