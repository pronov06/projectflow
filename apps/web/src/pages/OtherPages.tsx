import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { buttonClasses } from '../components/ui/Button';
import { PageHeader } from '../components/ui/States';
import { TaskBrowser } from '../features/tasks/TaskBrowser';
import { formatDate } from '../lib/format';

export function TasksPage() {
  return (
    <>
      <PageHeader title="Tasks" description="All tasks across your projects." />
      <TaskBrowser />
    </>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const rows = [
    ['Full name', user.fullName],
    ['Email', user.email],
    ['Role', user.role === 'ADMIN' ? 'Administrator' : 'User'],
    ['Member since', formatDate(user.createdAt)],
  ];
  return (
    <>
      <PageHeader title="Profile" />
      <dl className="max-w-prose divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-4 px-20 py-16 sm:grid-cols-3">
            <dt className="text-body text-ink-muted">{label}</dt>
            <dd className="break-words text-body text-ink sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-16 max-w-prose rounded-card bg-surface-tint p-16 text-body text-ink-brand">
        The same account works in the ProjectFlow Android app — log in there with this email.
      </p>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-80 text-center">
      <p className="text-label text-ink-muted">404</p>
      <h1 className="mt-8 text-heading text-ink-brand">Page not found</h1>
      <p className="mt-8 text-body-lg text-ink-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className={buttonClasses('primary', 'md', 'mt-24')}>
        Go to dashboard
      </Link>
    </div>
  );
}
