import clsx from 'clsx';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '../../components/ui/Modal';
import { getErrorMessage } from '../../lib/errors';
import { formatDate, isOverdue } from '../../lib/format';
import { TaskFormModal } from './TaskFormModal';

const inlineSelect =
  'rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

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
    <li className={clsx('flex flex-col gap-3 p-4 sm:flex-row sm:items-center', update.isPending && 'opacity-60')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          disabled={update.isPending}
          onChange={() =>
            change(
              { status: done ? 'PENDING' : 'COMPLETED' },
              done ? 'Task reopened' : 'Task marked as completed',
            )
          }
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-600"
          aria-label={done ? `Mark "${task.name}" as not completed` : `Mark "${task.name}" as completed`}
        />
        <div className="min-w-0">
          <p className={clsx('break-words text-sm font-medium', done ? 'text-slate-400 line-through' : 'text-slate-900')}>
            {task.name}
          </p>
          {task.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{task.description}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {showProject && (
              <Link to={`/projects/${task.project.id}`} className="font-medium text-brand-700 hover:underline">
                {task.project.name}
              </Link>
            )}
            <span className={clsx('inline-flex items-center gap-1', overdue && 'font-medium text-red-600')}>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              {overdue && ' · Overdue'}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-8 sm:pl-0">
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
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Edit "${task.name}"`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete "${task.name}"`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            showProject={showProject}
            onEdit={() => setEditing(t)}
            onDelete={() => setDeleting(t)}
          />
        ))}
      </ul>
      <TaskFormModal open={!!editing} task={editing} onClose={() => setEditing(undefined)} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete task?"
        message={
          <>
            <strong>{deleting?.name}</strong> will be permanently deleted.
          </>
        }
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(undefined)}
      />
    </>
  );
}
