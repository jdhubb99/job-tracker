import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/$')({
  component: NotFound,
});

function NotFound() {
  const user = useAuthStore((s) => s.user);
  const linkTo = user ? '/dashboard' : '/login';
  const linkLabel = user ? 'Go to Dashboard' : 'Go to Login';

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      aria-labelledby="not-found-heading"
    >
      <h1 id="not-found-heading" className="text-4xl font-bold">
        404
      </h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to={linkTo}>{linkLabel}</Link>
      </Button>
    </main>
  );
}
