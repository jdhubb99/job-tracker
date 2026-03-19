import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { RegistrationCard } from '../auth/RegistrationCard';
import { ApiError } from '@/lib/api';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to, ...props }, children),
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
const mockedRegister = authApi.register as ReturnType<typeof vi.fn>;

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

describe('RegistrationCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('renders all form fields with correct labels', () => {
    render(<RegistrationCard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders a create account button', () => {
    render(<RegistrationCard />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('requires all fields', () => {
    render(<RegistrationCard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('First Name')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Last Name')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-required', 'true');
  });

  it('submits registration data and navigates on success', async () => {
    mockedRegister.mockResolvedValueOnce(mockTokenResponse);
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
    });
  });

  it('sets auth state on successful registration', async () => {
    mockedRegister.mockResolvedValueOnce(mockTokenResponse);
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(mockTokenResponse.user);
      expect(useAuthStore.getState().accessToken).toBe('test-token');
    });
  });

  it('displays API error message on failed registration', async () => {
    mockedRegister.mockRejectedValueOnce(
      new ApiError(409, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Email already registered',
        path: '/api/auth/register',
        fieldErrors: null,
      })
    );
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email already registered');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays field-level errors from API', async () => {
    mockedRegister.mockRejectedValueOnce(
      new ApiError(400, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        path: '/api/auth/register',
        fieldErrors: { email: 'Email is already in use' },
      })
    );
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Email is already in use')).toBeInTheDocument();
    });
  });

  it('displays generic error on unexpected failure', async () => {
    mockedRegister.mockRejectedValueOnce(new Error('Network failure'));
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  it('shows loading state during submission', async () => {
    let resolveRegister: (value: typeof mockTokenResponse) => void;
    mockedRegister.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Creating account...' });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveRegister!(mockTokenResponse);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
    });
  });

  it('sets aria-invalid on inputs when server error occurs', async () => {
    mockedRegister.mockRejectedValueOnce(
      new ApiError(409, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Email already registered',
        path: '/api/auth/register',
        fieldErrors: null,
      })
    );
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Last Name')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('focuses first name input on server error', async () => {
    mockedRegister.mockRejectedValueOnce(
      new ApiError(409, {
        timestamp: '2026-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Email already registered',
        path: '/api/auth/register',
        fieldErrors: null,
      })
    );
    render(<RegistrationCard />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveFocus();
    });
  });

  it('has accessible form structure', () => {
    render(<RegistrationCard />, { wrapper: createWrapper() });

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-labelledby');

    const form = region.querySelector('form');
    expect(form).toHaveAttribute('aria-labelledby');
    expect(form).toHaveAttribute('aria-describedby');
  });

  it('has a link to the login page', () => {
    render(<RegistrationCard />, { wrapper: createWrapper() });
    const link = screen.getByRole('link', { name: 'Sign in' });
    expect(link).toHaveAttribute('href', '/login');
  });

  describe('client-side validation', () => {
    it('shows required errors when all fields are empty', async () => {
      const user = userEvent.setup();
      render(<RegistrationCard />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it('shows invalid email error for malformed email', async () => {
      const user = userEvent.setup();
      render(<RegistrationCard />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText('Email'), 'not-an-email');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      });
      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it('shows password too short error', async () => {
      const user = userEvent.setup();
      render(<RegistrationCard />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'short');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it('sets aria-invalid on fields with validation errors', async () => {
      const user = userEvent.setup();
      render(<RegistrationCard />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Last Name')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
