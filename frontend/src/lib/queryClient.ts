import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { notify } from '@/lib/notifications';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    // Surface query failures as toasts globally. Mutations toast via
    // `mutations.onError`; queries need a QueryCache handler since their
    // errors are otherwise swallowed unless a component reads them.
    queryCache: new QueryCache({
      onError(error) {
        // 401 is handled by the auth refresh/logout flow — a toast here would
        // be redundant noise during a session expiry.
        if (error instanceof ApiError && error.status === 401) {
          return;
        }
        notify.error(error);
      },
    }),
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
          // 401 is handled by the auth refresh/logout flow — a toast here would
          // be redundant noise during a session expiry.
          if (error instanceof ApiError && error.status === 401) {
            return;
          }
          notify.error(error);
        },
      },
    },
  });
}
