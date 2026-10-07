import clsx from 'clsx';
import {
  PROJECT_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from '@pms/shared';

const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset';

const statusColors: Record<ProjectStatus | TaskStatus, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-700 ring-slate-300',
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-slate-50 text-slate-600 ring-slate-300',
  MEDIUM: 'bg-orange-50 text-orange-700 ring-orange-300',
  HIGH: 'bg-red-50 text-red-700 ring-red-300',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={clsx(base, statusColors[status])}>{PROJECT_STATUS_LABELS[status]}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={clsx(base, statusColors[status])}>{TASK_STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={clsx(base, priorityColors[priority])}>{TASK_PRIORITY_LABELS[priority]}</span>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
