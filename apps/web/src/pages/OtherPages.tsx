import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { TaskBrowser } from '../features/tasks/TaskBrowser';
import { PageHeader } from '../components/ui/States';
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
  return (
    <>
      <PageHeader title="Profile" />
      <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {[
          ['Full name', user.fullName],
          ['Email', user.email],
          ['Role', user.role === 'ADMIN' ? 'Administrator' : 'User'],
          ['Member since', formatDate(user.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-3">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="break-words text-sm font-medium text-slate-900 sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-slate-500">
        The same account works in the ProjectFlow Android app — log in there with this email.
      </p>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-brand-700 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
