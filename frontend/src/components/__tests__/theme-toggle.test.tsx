import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';

const setThemeMock = vi.fn();
let currentTheme = 'system';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme: setThemeMock,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    cleanup();
    currentTheme = 'system';
    setThemeMock.mockClear();
  });

  it('renders a button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cycles from system to light', () => {
    currentTheme = 'system';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('cycles from light to dark', () => {
    currentTheme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system', () => {
    currentTheme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });

  it('shows correct aria-label for next theme', () => {
    currentTheme = 'light';
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark theme');
  });
});
