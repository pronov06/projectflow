import clsx from 'clsx';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, FolderKanban, ListTodo, Loader } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from '@pms/shared';
import { useDashboard } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { ProgressBar } from '../components/ui/Badges';
import { Skeleton } from '../components/ui/Spinner';
import { ErrorState, PageHeader } from '../components/ui/States';

interface StatProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  to: string;
  /** Feature tile: forest panel instead of a light card. */
  featured?: boolean;
  danger?: boolean;
}

function StatCard({ label, value, icon: Icon, to, featured, danger }: StatProps) {
  return (
    <Link
      to={to}
      className={clsx(
        'group flex flex-col justify-between gap-24 rounded-card border p-20 transition-colors',
        featured
          ? 'border-panel bg-panel text-on-panel hover:bg-panel-hover'
          : 'border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-warm',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            'flex size-40 items-center justify-center rounded-icon',
            featured ? 'bg-accent text-on-accent' : danger ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-ink-brand',
          )}
        >
          <Icon className="size-20" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className={clsx('size-16 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2', featured ? 'text-on-panel-muted' : 'text-ink-muted')}
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-heading">{value}</p>
        <p className={clsx('mt-4 text-body', featured ? 'text-on-panel-muted' : 'text-ink-muted')}>{label}</p>
      </div>
    </Link>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <section className="rounded-card border border-line bg-surface p-24">
      <h2 className="text-subheading text-ink-brand">{title}</h2>
      <ul className="mt-20 flex flex-col gap-16">
        {rows.map((r) => {
          const pct = total ? Math.round((r.value / total) * 100) : 0;
          return (
            <li key={r.label}>
              <div className="mb-6 flex justify-between text-body">
                <span className="text-ink-muted">{r.label}</span>
                <span className="text-ink">
                  {r.value} <span className="text-ink-muted">· {pct}%</span>
                </span>
              </div>
              <ProgressBar value={pct} label={`${title}: ${r.label}`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <>
      <PageHeader title={`Hi, ${user?.fullName.split(' ')[0] ?? 'there'}`} description="Here's how your work is going." />
      {isLoading ? (
        <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-160" />
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard featured label="Total projects" value={data.totalProjects} icon={FolderKanban} to="/projects" />
            <StatCard label="Projects in progress" value={data.projectsInProgress} icon={Loader} to="/projects?status=IN_PROGRESS" />
            <StatCard label="Total tasks" value={data.totalTasks} icon={ListTodo} to="/tasks" />
            <StatCard label="Completed tasks" value={data.completedTasks} icon={CheckCircle2} to="/tasks?status=COMPLETED" />
            <StatCard label="Pending tasks" value={data.pendingTasks} icon={Clock} to="/tasks?status=PENDING" />
            <StatCard danger label="Overdue tasks" value={data.overdueTasks} icon={AlertTriangle} to="/tasks?sortBy=dueDate:asc" />
          </div>
          <div className="mt-24 grid gap-16 lg:grid-cols-2">
            <Breakdown
              title="Projects by status"
              rows={PROJECT_STATUSES.map((s) => ({ label: PROJECT_STATUS_LABELS[s], value: data.projectsByStatus[s] }))}
            />
            <Breakdown
              title="Tasks by priority"
              rows={[...TASK_PRIORITIES].reverse().map((p) => ({ label: TASK_PRIORITY_LABELS[p], value: data.tasksByPriority[p] }))}
            />
          </div>
        </>
      )}
    </>
  );
}
