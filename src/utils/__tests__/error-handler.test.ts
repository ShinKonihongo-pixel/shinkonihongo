// Tests for centralized error handling utility

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleError, ERROR_MESSAGES } from '../error-handler';

describe('handleError', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes Error objects to message string', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = handleError(new Error('test error'), { context: 'test' });
    expect(result).toBe('test error');
    spy.mockRestore();
  });

  it('normalizes string errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = handleError('string error', { context: 'test' });
    expect(result).toBe('string error');
    spy.mockRestore();
  });

  it('normalizes unknown errors to default message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = handleError(42, { context: 'test' });
    expect(result).toBe('Lỗi không xác định');
    spy.mockRestore();
  });

  it('logs with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleError(new Error('fail'), { context: 'useAuth/login' });
    expect(spy).toHaveBeenCalledWith('[useAuth/login]', 'fail');
    spy.mockRestore();
  });

  it('uses console.warn for warning severity', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    handleError('warning msg', { context: 'test', severity: 'warning' });
    expect(spy).toHaveBeenCalledWith('[test]', 'warning msg');
    spy.mockRestore();
  });

  it('uses console.info for info severity', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    handleError('info msg', { context: 'test', severity: 'info' });
    expect(spy).toHaveBeenCalledWith('[test]', 'info msg');
    spy.mockRestore();
  });

  it('returns userMessage when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = handleError(new Error('internal'), { context: 'test', userMessage: 'Đã có lỗi' });
    expect(result).toBe('Đã có lỗi');
    spy.mockRestore();
  });

  it('sanitizes Firebase error paths', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = handleError(new Error('FirebaseError: PERMISSION_DENIED projects/my-proj/databases/default'), { context: 'test' });
    expect(result).not.toContain('projects/my-proj');
    expect(result).toContain('[database]');
    spy.mockRestore();
  });

  it('returns raw message when silent', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = handleError(new Error('raw'), { context: 'test', silent: true });
    expect(result).toBe('raw');
    spy.mockRestore();
  });

  it('truncates long error messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const longMsg = 'x'.repeat(300);
    const result = handleError(new Error(longMsg), { context: 'test' });
    expect(result.length).toBeLessThanOrEqual(203); // 200 + '...'
    spy.mockRestore();
  });

  it('defaults context to "unknown"', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleError(new Error('fail'));
    expect(spy).toHaveBeenCalledWith('[unknown]', 'fail');
    spy.mockRestore();
  });
});

describe('ERROR_MESSAGES', () => {
  it('has Vietnamese messages for common scenarios', () => {
    expect(ERROR_MESSAGES.NETWORK).toContain('kết nối');
    expect(ERROR_MESSAGES.PERMISSION).toContain('quyền');
    expect(ERROR_MESSAGES.SAVE_FAILED).toContain('Lưu');
    expect(ERROR_MESSAGES.UNKNOWN).toContain('lỗi');
  });
});
