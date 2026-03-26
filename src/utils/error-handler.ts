// Centralized error handling utility
// Normalizes errors, logs with context, and returns user-safe messages
// All catch blocks should use this instead of bare console.error

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface HandleErrorOptions {
  /** Severity level for logging */
  severity?: ErrorSeverity;
  /** Context identifier (e.g., "useAuth/login") for debugging */
  context?: string;
  /** Vietnamese user-facing message (overrides normalized error) */
  userMessage?: string;
  /** If true, only log — don't return user-facing message */
  silent?: boolean;
}

// Normalize unknown error to string
function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Lỗi không xác định';
}

// Sanitize error for user display — strip internal details
function sanitizeForUser(message: string): string {
  // Remove Firebase internal paths
  const sanitized = message
    .replace(/FirebaseError:\s*/g, '')
    .replace(/\(auth\/[^)]+\)/g, '')
    .replace(/projects\/[^/]+\/databases\/[^/]+/g, '[database]');

  // Cap length
  return sanitized.length > 200 ? sanitized.slice(0, 200) + '...' : sanitized;
}

/**
 * Handle an error with consistent logging and optional user message.
 *
 * @returns Normalized, sanitized error message suitable for setError() / UI display
 *
 * Usage in hooks:
 * ```ts
 * try {
 *   await someOperation();
 * } catch (err) {
 *   const msg = handleError(err, { context: 'useAuth/login' });
 *   setError(msg);
 * }
 * ```
 *
 * Usage for silent logging:
 * ```ts
 * } catch (err) {
 *   handleError(err, { context: 'useOffline/sync', silent: true });
 * }
 * ```
 */
export function handleError(error: unknown, options: HandleErrorOptions = {}): string {
  const {
    severity = 'error',
    context = 'unknown',
    userMessage,
    silent = false,
  } = options;

  const rawMessage = normalizeError(error);
  const prefix = `[${context}]`;

  // Log with appropriate level
  switch (severity) {
    case 'info':
      console.info(prefix, rawMessage);
      break;
    case 'warning':
      console.warn(prefix, rawMessage);
      break;
    case 'critical':
      console.error(prefix, '🚨 CRITICAL:', rawMessage, error);
      break;
    default:
      console.error(prefix, rawMessage);
  }

  if (silent) return rawMessage;

  // Return user-safe message
  return userMessage || sanitizeForUser(rawMessage);
}

// Default Vietnamese error messages for common scenarios
export const ERROR_MESSAGES = {
  NETWORK: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  PERMISSION: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  SAVE_FAILED: 'Lưu thất bại. Vui lòng thử lại.',
  DELETE_FAILED: 'Xoá thất bại. Vui lòng thử lại.',
  LOAD_FAILED: 'Tải dữ liệu thất bại.',
  UNKNOWN: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
} as const;
