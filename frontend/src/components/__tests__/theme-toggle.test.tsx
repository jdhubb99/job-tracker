import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';

const setThemeMock = vi.fn();
let currentResolvedTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: currentResolvedTheme,
    setTheme: setThemeMock,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    cleanup();
    currentResolvedTheme = 'light';
    setThemeMock.mockClear();
  });

  it('renders a button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('switches from light to dark', () => {
    currentResolvedTheme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  it('switches from dark to light', () => {
    currentResolvedTheme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('shows correct aria-label for next theme', () => {
    currentResolvedTheme = 'light';
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark theme');
  });

  it('shows correct title for next theme', () => {
    currentResolvedTheme = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to light theme');
  });
});
