import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password-hash';

describe('Password Hashing', () => {
  it('hashes password to hex string', async () => {
    const hash = await hashPassword('test123');
    expect(hash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 = 64 hex chars
  });

  it('same password produces same hash', async () => {
    const h1 = await hashPassword('mypassword');
    const h2 = await hashPassword('mypassword');
    expect(h1).toBe(h2);
  });

  it('different passwords produce different hashes', async () => {
    const h1 = await hashPassword('password1');
    const h2 = await hashPassword('password2');
    expect(h1).not.toBe(h2);
  });

  it('verifyPassword returns true for matching password', async () => {
    const hash = await hashPassword('correct');
    const result = await verifyPassword('correct', hash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct');
    const result = await verifyPassword('wrong', hash);
    expect(result).toBe(false);
  });

  it('empty password still hashes', async () => {
    const hash = await hashPassword('');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('unicode password hashes correctly', async () => {
    const hash = await hashPassword('パスワード');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
