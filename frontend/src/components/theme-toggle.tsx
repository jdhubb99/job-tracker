import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

const themes = ['light', 'dark', 'system'] as const;

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const current = theme ?? 'system';
  const currentIndex = themes.indexOf(current as (typeof themes)[number]);
  const next = themes[(currentIndex + 1) % themes.length];
  const Icon = icons[current as keyof typeof icons] ?? Monitor;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
