import { createFileRoute } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/_auth/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-4" aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading" className="text-3xl font-bold">
        Welcome{user ? `, ${user.firstName}` : ''}
      </h1>
      <p className="text-muted-foreground">Your dashboard is coming soon.</p>
    </div>
  );
}
