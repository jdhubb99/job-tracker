import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

const mockUser = {
  id: '11234567-89ab-cdef-0123-456789abcdef',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuth sets user and accessToken together', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('test-token');
  });

  it('clearAuth clears both user and accessToken', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
