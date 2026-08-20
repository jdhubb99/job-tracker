import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { ErrorFallback } from '../errors/ErrorFallback';
import { NotFound } from '../errors/NotFound';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) =>
    createElement('a', { href: to as string, ...props }, children as ReactNode),
}));

describe('ErrorFallback', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the error heading with an alert role', () => {
    render(<ErrorFallback error={new Error('kaboom')} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows a Try again button that calls reset when provided', () => {
    const reset = vi.fn();
    render(<ErrorFallback error={new Error('kaboom')} reset={reset} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('omits the Try again button when no reset is provided', () => {
    render(<ErrorFallback error={new Error('kaboom')} />);
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });
});

describe('NotFound', () => {
  beforeEach(() => {
    cleanup();
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('links to login when signed out', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Go to Login').closest('a')).toHaveAttribute('href', '/login');
  });

  it('links to dashboard when signed in', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        createdAt: '',
        updatedAt: '',
      },
    });
    render(<NotFound />);
    expect(screen.getByText('Go to Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
