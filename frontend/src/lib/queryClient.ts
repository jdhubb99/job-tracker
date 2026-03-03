import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry(failureCount, error) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
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
