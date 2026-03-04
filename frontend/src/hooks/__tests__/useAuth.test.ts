import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '../useAuth';

const mockUser = {
  id: '11234567-89ab-cdef-0123-456789abcdef',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockTokenResponse = {
  accessToken: 'test-token',
  tokenType: 'Bearer',
  expiresAt: '2025-01-01T01:00:00Z',
  user: mockUser,
};

vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const { authApi } = await import('@/lib/api');
const mockedAuthApi = authApi as unknown as {
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useAuth', () => {
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null });
    dispatchSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('returns isAuthenticated false when no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('returns isAuthenticated true when user exists', () => {
    useAuthStore.setState({ user: mockUser, accessToken: 'token' });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('loginMutation calls authApi.login and sets auth', async () => {
    mockedAuthApi.login.mockResolvedValueOnce(mockTokenResponse);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.loginMutation.mutate({ email: 'test@example.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.loginMutation.isSuccess).toBe(true));

    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe('test-token');
  });

  it('registerMutation calls authApi.register and sets auth', async () => {
    mockedAuthApi.register.mockResolvedValueOnce(mockTokenResponse);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.registerMutation.mutate({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    await waitFor(() => expect(result.current.registerMutation.isSuccess).toBe(true));

    expect(mockedAuthApi.register).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('logoutMutation clears auth and dispatches auth:logout', async () => {
    useAuthStore.setState({ user: mockUser, accessToken: 'token' });
    mockedAuthApi.logout.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.logoutMutation.mutate();
    });

    await waitFor(() => expect(result.current.logoutMutation.isSuccess).toBe(true));

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0]).toHaveProperty('type', 'auth:logout');
  });

  it('logoutMutation clears auth even if API call fails', async () => {
    useAuthStore.setState({ user: mockUser, accessToken: 'token' });
    mockedAuthApi.logout.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.logoutMutation.mutate();
    });

    await waitFor(() => expect(result.current.logoutMutation.isError).toBe(true));

    expect(useAuthStore.getState().user).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0]).toHaveProperty('type', 'auth:logout');
  });
});
