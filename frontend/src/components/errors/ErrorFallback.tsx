import { TriangleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  /** Clears the error and re-attempts rendering. Provided by the router or boundary. */
  reset?: () => void;
}

/**
 * Shared fallback shown when a render or route error is caught. Rendered by the
 * TanStack Router root `errorComponent` and by the top-level ErrorBoundary.
 */
export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      role="alert"
      aria-labelledby="error-heading"
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlertIcon className="size-6" />
          </div>
          <CardTitle id="error-heading">Something went wrong</CardTitle>
          <CardDescription>An unexpected error occurred while loading this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {import.meta.env.DEV && error?.message ? (
            <pre className="text-muted-foreground max-h-32 overflow-auto rounded-md bg-muted p-3 text-left text-xs">
              {error.message}
            </pre>
          ) : null}
          <div className="flex justify-center gap-2">
            {reset ? <Button onClick={reset}>Try again</Button> : null}
            <Button variant="outline" onClick={() => window.location.assign('/')}>
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
