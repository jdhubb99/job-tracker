import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveErrorMessage, notify } from '../notifications';
import { ApiError } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('resolveErrorMessage', () => {
  it('returns a generic permission message for 403', () => {
    expect(resolveErrorMessage(new ApiError(403, null))).toBe(
      'You do not have permission to perform this action.'
    );
  });

  it('returns a generic server message for 5xx', () => {
    expect(resolveErrorMessage(new ApiError(500, null))).toBe(
      'Something went wrong on our end. Please try again shortly.'
    );
    expect(resolveErrorMessage(new ApiError(503, null))).toBe(
      'Something went wrong on our end. Please try again shortly.'
    );
  });

  it('surfaces the backend message for 4xx', () => {
    const body = {
      timestamp: '',
      status: 400,
      error: 'Bad Request',
      message: 'Company is required',
      path: '/api/job-applications',
      fieldErrors: null,
    };
    expect(resolveErrorMessage(new ApiError(400, body))).toBe('Company is required');
  });

  it('returns a network message for TypeError', () => {
    expect(resolveErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Network error. Check your connection and try again.'
    );
  });

  it('falls back to the error message for a plain Error', () => {
    expect(resolveErrorMessage(new Error('Boom'))).toBe('Boom');
  });

  it('falls back to a generic message for unknown values', () => {
    expect(resolveErrorMessage('nope')).toBe('An unexpected error occurred. Please try again.');
    expect(resolveErrorMessage(new Error(''))).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });
});

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('de-duplicates error toasts by message id', async () => {
    const { toast } = await import('sonner');
    notify.error(new ApiError(403, null));
    expect(toast.error).toHaveBeenCalledWith('You do not have permission to perform this action.', {
      id: 'error:You do not have permission to perform this action.',
    });
  });

  it('forwards success and info messages', async () => {
    const { toast } = await import('sonner');
    notify.success('Saved');
    notify.info('Heads up');
    expect(toast.success).toHaveBeenCalledWith('Saved');
    expect(toast.info).toHaveBeenCalledWith('Heads up');
  });
});
