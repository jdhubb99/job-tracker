import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { createAppQueryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

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
});
