import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LoginCard } from '../auth/LoginCard';
import { ApiError } from '@/lib/api';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      me: vi.fn(),
    },
  };
});

const { authApi } = await import('@/lib/api');
const mockedLogin = authApi.login as ReturnType<typeof vi.fn>;

const mockTokenResponse = {
  accessToken: 'test-token',
  tokenType: 'Bearer',
  expiresAt: '2026-01-01T01:00:00Z',
  user: {
    id: '11234567-89ab-cdef-0123-456789abcdef',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('LoginCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('renders email and password fields', () => {
    render(<LoginCard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders a sign in button', () => {
    render(<LoginCard />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('requires email and password fields', () => {
    render(<LoginCard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-required', 'true');
  });

  it('submits credentials and navigates on success', async () => {
    mockedLogin.mockResolvedValueOnce(mockTokenResponse);
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
    });
  });

  it('sets auth state on successful login', async () => {
    mockedLogin.mockResolvedValueOnce(mockTokenResponse);
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(mockTokenResponse.user);
      expect(useAuthStore.getState().accessToken).toBe('test-token');
    });
  });

  it('displays API error message on failed login', async () => {
    mockedLogin.mockRejectedValueOnce(
      new ApiError(401, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        path: '/api/auth/login',
        fieldErrors: null,
      })
    );
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays generic error on unexpected failure', async () => {
    mockedLogin.mockRejectedValueOnce(new Error('Network failure'));
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  it('shows loading state during submission', async () => {
    let resolveLogin: (value: typeof mockTokenResponse) => void;
    mockedLogin.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Signing in...' });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveLogin!(mockTokenResponse);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });
  });

  it('sets aria-invalid on inputs when server error occurs', async () => {
    mockedLogin.mockRejectedValueOnce(
      new ApiError(401, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        path: '/api/auth/login',
        fieldErrors: null,
      })
    );
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('focuses email input on server error for accessibility', async () => {
    mockedLogin.mockRejectedValueOnce(
      new ApiError(401, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        path: '/api/auth/login',
        fieldErrors: null,
      })
    );
    render(<LoginCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveFocus();
    });
  });

  it('has accessible form structure', () => {
    render(<LoginCard />, { wrapper: createWrapper() });

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-labelledby');

    const form = region.querySelector('form');
    expect(form).toHaveAttribute('aria-labelledby');
    expect(form).toHaveAttribute('aria-describedby');
  });

  describe('client-side validation', () => {
    it('shows required error when email is empty', async () => {
      const user = userEvent.setup();
      render(<LoginCard />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      expect(mockedLogin).not.toHaveBeenCalled();
    });

    it('shows required error when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginCard />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(mockedLogin).not.toHaveBeenCalled();
    });

    it('shows invalid email error for malformed email', async () => {
      const user = userEvent.setup();
      render(<LoginCard />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Email'), 'not-an-email');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      });
      expect(mockedLogin).not.toHaveBeenCalled();
    });

    it('shows both errors when both fields are empty', async () => {
      const user = userEvent.setup();
      render(<LoginCard />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(mockedLogin).not.toHaveBeenCalled();
    });

    it('focuses first invalid field on validation error', async () => {
      const user = userEvent.setup();
      render(<LoginCard />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toHaveFocus();
      });
    });

    it('sets aria-invalid on fields with validation errors', async () => {
      const user = userEvent.setup();
      render(<LoginCard />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
