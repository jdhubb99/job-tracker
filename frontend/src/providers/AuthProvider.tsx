import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { isLoading } = useQuery({
    queryKey: ['auth', 'refresh'],
    queryFn: async () => {
      const data = await authApi.refresh();
      if (data) {
        setAuth(data.user, data.accessToken);
      } else {
        clearAuth();
      }
      return data;
    },
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
