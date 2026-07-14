import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAppQueryClient } from '../queryClient';
import { ApiError } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('createAppQueryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets default staleTime to 5 minutes', () => {
    const client = createAppQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('returns false for 401 ApiError', () => {
    const client = createAppQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown
    ) => boolean;
    const error = new ApiError(401, null);
    expect(retry(0, error)).toBe(false);
  });

  it('returns false for 403 ApiError', () => {
    const client = createAppQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown
    ) => boolean;
    const error = new ApiError(403, null);
    expect(retry(0, error)).toBe(false);
  });

  it('allows up to 2 retries for other errors', () => {
    const client = createAppQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown
    ) => boolean;
    const error = new Error('Network error');
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it('calls toast.error on mutation error', async () => {
    const { toast } = await import('sonner');
    const client = createAppQueryClient();
    const onError = client.getDefaultOptions().mutations?.onError;
    const error = new Error('Mutation failed');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (onError as any)?.(error);
    expect(toast.error).toHaveBeenCalledWith('Mutation failed', expect.objectContaining({}));
  });

  it('surfaces query errors as toasts via the query cache', async () => {
    const { toast } = await import('sonner');
    const client = createAppQueryClient();
    const onError = client.getQueryCache().config.onError;
    onError?.(new ApiError(500, null), {} as never);
    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong on our end. Please try again shortly.',
      expect.objectContaining({})
    );
  });

  it('does not toast query 401 errors (handled by auth flow)', async () => {
    const { toast } = await import('sonner');
    const client = createAppQueryClient();
    const onError = client.getQueryCache().config.onError;
    onError?.(new ApiError(401, null), {} as never);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
