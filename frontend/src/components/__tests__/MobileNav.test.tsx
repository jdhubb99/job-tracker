import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MobileNav } from '../layout/MobileNav';

let mockPathname = '/dashboard';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) =>
    createElement('a', { href: to as string, ...props }, children as ReactNode),
  useRouterState: () => ({
    location: { pathname: mockPathname },
  }),
}));

describe('MobileNav', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPathname = '/dashboard';
  });

  it('renders nav links when open', () => {
    render(<MobileNav open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('renders the app title in the sheet', () => {
    render(<MobileNav open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('Job Tracker')).toBeInTheDocument();
  });

  it('renders nav links with correct paths', () => {
    render(<MobileNav open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Jobs').closest('a')).toHaveAttribute('href', '/jobs');
  });

  it('does not call onOpenChange on initial mount', () => {
    render(<MobileNav open={true} onOpenChange={mockOnOpenChange} />);
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  it('calls onOpenChange(false) on route change', () => {
    const { rerender } = render(<MobileNav open={true} onOpenChange={mockOnOpenChange} />);
    mockOnOpenChange.mockClear();

    mockPathname = '/jobs';
    rerender(<MobileNav open={true} onOpenChange={mockOnOpenChange} />);

    expect(mockOnOpenChange).toHaveBeenCalledTimes(1);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
