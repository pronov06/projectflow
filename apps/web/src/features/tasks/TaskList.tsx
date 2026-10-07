import clsx from 'clsx';
import { Check, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskUpdateInput,
} from '@pms/shared';
import { useDeleteTask, useUpdateTask } from '../../api/hooks';
import { PriorityBadge } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { getErrorMessage } from '../../lib/errors';
import { formatDate, isOverdue } from '../../lib/format';
import { TaskFormModal } from './TaskFormModal';

const inlineSelect =
  'rounded-button border border-line bg-surface py-6 pr-28 pl-12 text-label text-ink transition-colors hover:border-line-strong focus:border-panel focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:opacity-50';

function TaskRow({
  task,
  showProject,
  onEdit,
  onDelete,
}: {
  task: Task;
  showProject: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const update = useUpdateTask();
  const done = task.status === 'COMPLETED';
  const overdue = isOverdue(task.dueDate, task.status);

  const change = (input: TaskUpdateInput, message: string) =>
    update.mutate(
      { id: task.id, input },
      { onSuccess: () => toast.success(message), onError: (err) => toast.error(getErrorMessage(err)) },
    );

  return (
    <li
      className={clsx(
        'flex flex-col gap-12 px-20 py-16 transition-colors hover:bg-canvas sm:flex-row sm:items-center',
        update.isPending && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-12">
        {/* Custom checkbox: a real <input> for semantics, styled square with a mint tick. */}
        <label className="relative mt-2 flex size-20 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={done}
            disabled={update.isPending}
            onChange={() =>
              change({ status: done ? 'PENDING' : 'COMPLETED' }, done ? 'Task reopened' : 'Task marked as completed')
            }
            className="peer absolute inset-0 cursor-pointer appearance-none rounded-icon border border-line-strong bg-surface transition-colors checked:border-panel checked:bg-panel focus-visible:outline-2 focus-visible:outline-focus"
            aria-label={done ? `Mark "${task.name}" as not completed` : `Mark "${task.name}" as completed`}
          />
          <Check className="pointer-events-none relative size-14 text-accent opacity-0 peer-checked:opacity-100" aria-hidden="true" />
        </label>
        <div className="min-w-0">
          <p className={clsx('text-body-lg break-words', done ? 'text-ink-muted line-through' : 'text-ink')}>{task.name}</p>
          {task.description && <p className="mt-2 line-clamp-2 text-body text-ink-muted">{task.description}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-6 text-label text-ink-muted">
            {showProject && (
              <Link to={`/projects/${task.project.id}`} className="text-ink-brand underline-offset-4 hover:underline">
                {task.project.name}
              </Link>
            )}
            <span className={clsx('inline-flex items-center gap-4', overdue && 'text-danger')}>
              <CalendarDays className="size-14" aria-hidden="true" />
              {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              {overdue && ' · Overdue'}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6 pl-32 sm:flex-nowrap sm:pl-0">
        <label className="sr-only" htmlFor={`status-${task.id}`}>
          Status
        </label>
        <select
          id={`status-${task.id}`}
          value={task.status}
          disabled={update.isPending}
          onChange={(e) => change({ status: e.target.value as Task['status'] }, 'Status updated')}
          className={inlineSelect}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`priority-${task.id}`}>
          Priority
        </label>
        <select
          id={`priority-${task.id}`}
          value={task.priority}
          disabled={update.isPending}
          onChange={(e) => change({ priority: e.target.value as Task['priority'] }, 'Priority updated')}
          className={inlineSelect}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {TASK_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
        <Button variant="quiet" size="icon" onClick={onEdit} aria-label={`Edit "${task.name}"`}>
          <Pencil className="size-16" aria-hidden="true" />
        </Button>
        <Button
          variant="quiet"
          size="icon"
          onClick={onDelete}
          className="hover:bg-danger-soft hover:text-danger"
          aria-label={`Delete "${task.name}"`}
        >
          <Trash2 className="size-16" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

export function TaskList({ tasks, showProject = true }: { tasks: Task[]; showProject?: boolean }) {
  const [editing, setEditing] = useState<Task | undefined>();
  const [deleting, setDeleting] = useState<Task | undefined>();
  const remove = useDeleteTask();

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Task deleted');
        setDeleting(undefined);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} showProject={showProject} onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} />
        ))}
      </ul>
      <TaskFormModal open={!!editing} task={editing} onClose={() => setEditing(undefined)} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete task?"
        message={
          <>
            <span className="text-ink">{deleting?.name}</span> will be permanently deleted.
          </>
        }
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(undefined)}
      />
    </>
  );
}
