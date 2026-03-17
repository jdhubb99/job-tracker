import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const Icon = isDark ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} theme`}
      aria-label={`Switch to ${next} theme`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
