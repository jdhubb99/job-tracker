import { createRootRoute, Outlet, type ErrorComponentProps } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { createAppQueryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { ErrorFallback } from '@/components/errors/ErrorFallback';
import { NotFound } from '@/components/errors/NotFound';

const queryClient = createAppQueryClient();

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  ),
  errorComponent: ({ error, reset }: ErrorComponentProps) => (
    <ErrorFallback error={error} reset={reset} />
  ),
  notFoundComponent: NotFound,
});
