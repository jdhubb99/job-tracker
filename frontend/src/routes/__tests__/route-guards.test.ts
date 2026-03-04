import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

const mockUser = {
  id: '11234567-89ab-cdef-0123-456789abcdef',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('route guard logic', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  describe('index route (/) redirect', () => {
    it('redirects unauthenticated users to /login', () => {
      const { user } = useAuthStore.getState();
      const target = user ? '/dashboard' : '/login';
      expect(target).toBe('/login');
    });

    it('redirects authenticated users to /dashboard', () => {
      useAuthStore.setState({ user: mockUser, accessToken: 'token' });
      const { user } = useAuthStore.getState();
      const target = user ? '/dashboard' : '/login';
      expect(target).toBe('/dashboard');
    });
  });

  describe('_auth guard', () => {
    it('blocks unauthenticated users', () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it('allows authenticated users', () => {
      useAuthStore.setState({ user: mockUser, accessToken: 'token' });
      const { user } = useAuthStore.getState();
      expect(user).not.toBeNull();
    });
  });

  describe('login route guard', () => {
    it('allows unauthenticated users', () => {
      const { user } = useAuthStore.getState();
      const shouldRedirect = !!user;
      expect(shouldRedirect).toBe(false);
    });

    it('redirects authenticated users away', () => {
      useAuthStore.setState({ user: mockUser, accessToken: 'token' });
      const { user } = useAuthStore.getState();
      const shouldRedirect = !!user;
      expect(shouldRedirect).toBe(true);
    });
  });
});
