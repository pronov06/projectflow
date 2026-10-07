import clsx from 'clsx';
import { CheckSquare, FolderKanban, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../auth/AuthContext';
import { Logo } from '../Logo';
import { Button } from '../ui/Button';
import { NetworkBanner } from './NetworkBanner';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
];

function initials(name: string | undefined) {
  return (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * App shell: a floating forest panel (same surface language as the auth hero) on the cream canvas.
 * Desktop: fixed sidebar. Mobile: top bar + slide-in drawer.
 */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('You have been logged out.');
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col p-16">
      <div className="flex items-center justify-between px-8 pt-8 pb-24">
        <Logo tone="light" />
        <Button
          variant="inverse"
          size="icon"
          className="lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-20" aria-hidden="true" />
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-4" aria-label="Main">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-12 rounded-button px-16 py-10 text-body transition-colors',
                isActive ? 'bg-accent text-on-accent' : 'text-on-panel-muted hover:bg-on-panel/10 hover:text-on-panel',
              )
            }
          >
            <Icon className="size-20" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-card bg-on-panel/10 p-12">
        <div className="flex items-center gap-12">
          <span
            className="flex size-40 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-label text-ink-brand"
            aria-hidden="true"
          >
            {initials(user?.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-body text-on-panel">{user?.fullName}</p>
            <p className="truncate text-label text-on-panel-muted">{user?.email}</p>
          </div>
        </div>
        <Button variant="inverse" size="sm" className="mt-12 w-full" onClick={handleLogout} loading={loggingOut}>
          {!loggingOut && <LogOut className="size-16" aria-hidden="true" />}
          {loggingOut ? 'Logging out…' : 'Log out'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-12 left-12 hidden w-sidebar rounded-panel bg-panel lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-panel/50 animate-fade-in" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-12 left-12 w-sidebar max-w-full rounded-panel bg-panel animate-rise-in">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:ml-12 lg:pl-sidebar">
        <header className="sticky top-0 z-30 flex h-topbar items-center gap-12 border-b border-line bg-canvas px-16 lg:hidden">
          <Button variant="secondary" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-20" aria-hidden="true" />
          </Button>
          <Logo />
        </header>
        <NetworkBanner />
        <main className="mx-auto max-w-page px-16 py-24 sm:px-24 lg:px-40 lg:py-40">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
