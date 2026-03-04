import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { LoginCard } from '@/components/auth/LoginCard';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginCard />
    </main>
  );
}
