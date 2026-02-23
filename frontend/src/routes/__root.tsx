import { lazy, Suspense } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { createAppQueryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/sonner';

const queryClient = createAppQueryClient();

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((res) => ({
        default: res.TanStackRouterDevtools,
      }))
    )
  : () => null;

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((res) => ({
        default: res.ReactQueryDevtools,
      }))
    )
  : () => null;

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
        <Suspense>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  ),
});
