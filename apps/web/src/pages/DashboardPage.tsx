import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListTodo, Loader } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from '@pms/shared';
import { useDashboard } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Skeleton } from '../components/ui/Spinner';
import { ErrorState, PageHeader } from '../components/ui/States';

interface StatProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  to: string;
}

function StatCard({ label, value, icon: Icon, tone, to }: StatProps) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={clsx('rounded-lg p-2', tone)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </Link>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number; color: string }[] }) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => {
          const pct = total ? Math.round((r.value / total) * 100) : 0;
          return (
            <li key={r.label}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{r.label}</span>
                <span className="font-medium text-slate-900">
                  {r.value} <span className="font-normal text-slate-400">({pct}%)</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={clsx('h-full rounded-full', r.color)} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <>
      <PageHeader title={`Hi, ${user?.fullName.split(' ')[0] ?? 'there'}`} description="Here's how your work is going." />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total projects" value={data.totalProjects} icon={FolderKanban} tone="bg-brand-50 text-brand-600" to="/projects" />
            <StatCard label="Projects in progress" value={data.projectsInProgress} icon={Loader} tone="bg-blue-50 text-blue-600" to="/projects?status=IN_PROGRESS" />
            <StatCard label="Total tasks" value={data.totalTasks} icon={ListTodo} tone="bg-slate-100 text-slate-600" to="/tasks" />
            <StatCard label="Completed tasks" value={data.completedTasks} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600" to="/tasks?status=COMPLETED" />
            <StatCard label="Pending tasks" value={data.pendingTasks} icon={Clock} tone="bg-amber-50 text-amber-600" to="/tasks?status=PENDING" />
            <StatCard label="Overdue tasks" value={data.overdueTasks} icon={AlertTriangle} tone="bg-red-50 text-red-600" to="/tasks?sortBy=dueDate:asc" />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="Projects by status"
              rows={PROJECT_STATUSES.map((s) => ({
                label: PROJECT_STATUS_LABELS[s],
                value: data.projectsByStatus[s],
                color: s === 'COMPLETED' ? 'bg-emerald-500' : s === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-400',
              }))}
            />
            <Breakdown
              title="Tasks by priority"
              rows={[...TASK_PRIORITIES].reverse().map((p) => ({
                label: TASK_PRIORITY_LABELS[p],
                value: data.tasksByPriority[p],
                color: p === 'HIGH' ? 'bg-red-500' : p === 'MEDIUM' ? 'bg-orange-400' : 'bg-slate-400',
              }))}
            />
          </div>
        </>
      )}
    </>
  );
}
