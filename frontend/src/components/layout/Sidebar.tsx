import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Briefcase, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/jobs', icon: Briefcase },
] as const;

export function Sidebar() {
  const { user, logoutMutation } = useAuth();

  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '';

  return (
    <aside className="bg-background hidden h-screen w-64 flex-col border-r md:flex">
      <div className="flex h-14 items-center px-6 font-semibold">Job Tracker</div>
      <Separator />
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            activeProps={{
              className:
                'bg-accent text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
            }}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="flex items-center gap-3 p-4">
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logoutMutation.mutate()}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
