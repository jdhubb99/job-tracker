import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '../layout/AppLayout';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) =>
    createElement('a', { href: to as string, ...props }, children as ReactNode),
  Outlet: () => createElement('div', { 'data-testid': 'outlet' }, 'Page content'),
  useRouterState: () => ({
    location: { pathname: '/dashboard' },
  }),
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

describe('AppLayout', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, accessToken: 'test-token' });
  });

  it('renders Sidebar', () => {
    render(<AppLayout />, { wrapper: createWrapper() });
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders TopBar', () => {
    render(<AppLayout />, { wrapper: createWrapper() });
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders Outlet content', () => {
    render(<AppLayout />, { wrapper: createWrapper() });
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<AppLayout />, { wrapper: createWrapper() });
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('opens mobile nav when hamburger is clicked', () => {
    render(<AppLayout />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    // MobileNav should render nav links in the sheet
    const navLinks = screen.getAllByText('Dashboard');
    // One in sidebar, one in mobile nav
    expect(navLinks.length).toBeGreaterThanOrEqual(2);
  });
});
