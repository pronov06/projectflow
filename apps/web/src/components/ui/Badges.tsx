import clsx from 'clsx';
import {
  PROJECT_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from '@pms/shared';

const pill = 'inline-flex items-center gap-6 rounded-pill px-10 py-2 text-label whitespace-nowrap';

/** Status → tone. Mint is reserved for "done"; forest for "active". */
const statusTone: Record<ProjectStatus | TaskStatus, string> = {
  NOT_STARTED: 'border border-line bg-surface text-ink-muted',
  PENDING: 'bg-surface-warm text-ink',
  IN_PROGRESS: 'bg-panel text-on-panel',
  COMPLETED: 'bg-accent-soft text-ink-brand',
};

const priorityTone: Record<TaskPriority, string> = {
  LOW: 'border border-line text-ink-muted',
  MEDIUM: 'border border-line-strong text-ink',
  HIGH: 'bg-danger-soft text-danger',
};

const priorityDots: Record<TaskPriority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

/** Same statuses rendered on a forest panel, where the light tones would disappear. */
const statusToneOnPanel: Record<ProjectStatus, string> = {
  NOT_STARTED: 'border border-on-panel/30 text-on-panel-muted',
  IN_PROGRESS: 'border border-accent text-accent',
  COMPLETED: 'bg-accent text-on-accent',
};

export function ProjectStatusBadge({ status, onPanel = false }: { status: ProjectStatus; onPanel?: boolean }) {
  return (
    <span className={clsx(pill, onPanel ? statusToneOnPanel[status] : statusTone[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={clsx(pill, statusTone[status])}>{TASK_STATUS_LABELS[status]}</span>;
}

/** Priority is encoded twice (label + 1–3 bars) so it never relies on colour alone. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={clsx(pill, priorityTone[priority])}>
      <span className="flex items-end gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={clsx(
              'w-2 rounded-pill bg-current',
              n === 1 ? 'h-4' : n === 2 ? 'h-6' : 'h-8',
              n > priorityDots[priority] && 'opacity-25',
            )}
          />
        ))}
      </span>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}

export function ProgressBar({ value, label, tone = 'light' }: { value: number; label?: string; tone?: 'light' | 'dark' }) {
  return (
    <div
      className={clsx('h-6 w-full overflow-hidden rounded-pill', tone === 'dark' ? 'bg-on-panel/15' : 'bg-line')}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      {/* Width is data, not design: the one sanctioned inline style. */}
      <div
        className={clsx('h-full rounded-pill transition-all', tone === 'dark' ? 'bg-accent' : 'bg-panel')}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
