import { toast } from 'sonner';
import { ApiError } from '@/lib/api';

/**
 * Maps any thrown value to a user-facing message. Backend-provided messages
 * (validation, not-found, etc.) are surfaced as-is for 4xx, while 403 and 5xx
 * get friendly, generic copy so we never leak server internals to the user.
 */
export function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status >= 500) {
      return 'Something went wrong on our end. Please try again shortly.';
    }
    return error.message;
  }
  // fetch throws a TypeError when the network is unreachable.
  if (error instanceof TypeError) {
    return 'Network error. Check your connection and try again.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Centralized toast helpers so feature code never calls `sonner` directly.
 * Error toasts are de-duplicated by message, preventing spam when several
 * queries or mutations fail with the same underlying cause at once.
 */
export const notify = {
  success(message: string): void {
    toast.success(message);
  },
  info(message: string): void {
    toast.info(message);
  },
  error(error: unknown): void {
    const message = resolveErrorMessage(error);
    toast.error(message, { id: `error:${message}` });
  },
};
