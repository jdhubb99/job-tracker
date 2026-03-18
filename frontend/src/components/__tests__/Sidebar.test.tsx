import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '../layout/Sidebar';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) =>
    createElement('a', { href: to as string, ...props }, children as ReactNode),
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
const mockLogout = authApi.logout as ReturnType<typeof vi.fn>;

const mockUser = {
  id: '11234567-89ab-cdef-0123-456789abcdef',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Sidebar', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, accessToken: 'test-token' });
  });

  it('renders the app name', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByText('Job Tracker')).toBeInTheDocument();
  });

  it('renders nav links for Dashboard and Jobs', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('renders nav links with correct paths', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Jobs').closest('a')).toHaveAttribute('href', '/jobs');
  });

  it('displays user name and email', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays user initials in avatar', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('renders a logout button with title', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    const button = screen.getByRole('button', { name: 'Logout' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Logout');
  });

  it('calls logout mutation on button click', async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    render(<Sidebar />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('renders as aside element', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders nav element', () => {
    render(<Sidebar />, { wrapper: createWrapper() });
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
