import { useState, useCallback } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMenuClick = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  return (
    <div className="md:grid md:grid-cols-[16rem_1fr]">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-h-screen flex-col">
        <TopBar onMenuClick={handleMenuClick} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
