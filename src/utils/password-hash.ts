// Password hashing utility — SHA-256 via Web Crypto API
// Note: For production, migrate to Firebase Auth for proper auth

const SALT = 'shinko_v1_'; // Simple prefix salt

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
