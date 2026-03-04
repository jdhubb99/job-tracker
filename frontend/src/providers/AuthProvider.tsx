import { useEffect, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handler = () => router.navigate({ to: '/login' as string });
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [router]);

  return <>{children}</>;
}
