import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { TopBar } from '../layout/TopBar';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) =>
    createElement('a', { href: to as string, ...props }, children as ReactNode),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
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

describe('TopBar', () => {
  const mockMenuClick = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, accessToken: 'test-token' });
  });

  it('renders as header element', () => {
    render(<TopBar onMenuClick={mockMenuClick} />, { wrapper: createWrapper() });
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders hamburger menu button', () => {
    render(<TopBar onMenuClick={mockMenuClick} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
  });

  it('calls onMenuClick when hamburger is clicked', () => {
    render(<TopBar onMenuClick={mockMenuClick} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(mockMenuClick).toHaveBeenCalledOnce();
  });

  it('renders theme toggle button', () => {
    render(<TopBar onMenuClick={mockMenuClick} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /switch to .* theme/i })).toBeInTheDocument();
  });

  it('renders user menu button with title', () => {
    render(<TopBar onMenuClick={mockMenuClick} />, { wrapper: createWrapper() });
    expect(screen.getByTitle('User menu')).toBeInTheDocument();
  });

  it('displays user initials in avatar', () => {
    render(<TopBar onMenuClick={mockMenuClick} />, { wrapper: createWrapper() });
    expect(screen.getByText('TU')).toBeInTheDocument();
  });
});
