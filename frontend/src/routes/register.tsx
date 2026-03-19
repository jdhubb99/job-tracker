import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { RegistrationCard } from '@/components/auth/RegistrationCard';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <RegistrationCard />
    </main>
  );
}
