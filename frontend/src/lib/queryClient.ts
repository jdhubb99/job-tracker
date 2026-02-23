import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry(failureCount, error) {
          if (error instanceof Response && (error.status === 401 || error.status === 403)) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        onError(error) {
          toast.error(error instanceof Error ? error.message : 'An error occurred');
        },
      },
    },
  });
}
