import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    throw redirect({ to: user ? '/dashboard' : '/login' });
  },
});
