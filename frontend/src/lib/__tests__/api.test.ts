import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch, ApiError } from '../api';

const mockUser = {
  id: '11234567-89ab-cdef-0123-456789abcdef',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockTokenResponse = {
  accessToken: 'new-token',
  tokenType: 'Bearer',
  expiresAt: '2025-01-01T01:00:00Z',
  user: mockUser,
};

const fetchSpy = vi.fn();
globalThis.fetch = fetchSpy;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    fetchSpy.mockReset();
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('prepends /api and includes credentials', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiFetch('/health');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('attaches Authorization header when accessToken exists', async () => {
    useAuthStore.setState({ accessToken: 'my-token' });
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiFetch('/health');

    const headers = fetchSpy.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('throws ApiError on non-ok response', async () => {
    const errorBody = {
      timestamp: '2025-01-01T00:00:00Z',
      status: 400,
      error: 'Bad Request',
      message: 'Invalid input',
      path: '/api/test',
      fieldErrors: null,
    };
    fetchSpy.mockResolvedValueOnce(jsonResponse(errorBody, 400));

    await expect(apiFetch('/test')).rejects.toThrow(ApiError);
  });

  it('retries on 401 after successful refresh', async () => {
    useAuthStore.setState({ accessToken: 'expired-token' });

    // First call returns 401
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));
    // Refresh call succeeds
    fetchSpy.mockResolvedValueOnce(jsonResponse(mockTokenResponse));
    // Retry succeeds
    fetchSpy.mockResolvedValueOnce(jsonResponse({ data: 'success' }));

    const result = await apiFetch('/protected');

    expect(result).toEqual({ data: 'success' });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().accessToken).toBe('new-token');
  });

  it('clears auth and redirects on refresh failure', async () => {
    useAuthStore.setState({ accessToken: 'expired-token', user: mockUser });

    // Original call returns 401
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));
    // Refresh fails
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));

    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });

    await expect(apiFetch('/protected')).rejects.toThrow(ApiError);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('queues concurrent 401s behind a single refresh', async () => {
    useAuthStore.setState({ accessToken: 'expired-token' });

    // Both initial calls return 401
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));
    // Single refresh
    fetchSpy.mockResolvedValueOnce(jsonResponse(mockTokenResponse));
    // Both retries succeed
    fetchSpy.mockResolvedValueOnce(jsonResponse({ a: 1 }));
    fetchSpy.mockResolvedValueOnce(jsonResponse({ b: 2 }));

    const [r1, r2] = await Promise.all([apiFetch('/a'), apiFetch('/b')]);

    expect(r1).toEqual({ a: 1 });
    expect(r2).toEqual({ b: 2 });

    // 2 original + 1 refresh + 2 retries = 5
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });
});
