import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  taskCreateSchema,
  type Task,
} from '@pms/shared';
import { useCreateTask, useProjectOptions, useUpdateTask } from '../../api/hooks';
import { Button } from '../../components/ui/Button';
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { applyServerErrors, getErrorMessage } from '../../lib/errors';

type FormIn = z.input<typeof taskCreateSchema>;
type FormOut = z.output<typeof taskCreateSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  task?: Task;
  /** Preselects the project when creating from a project page. */
  projectId?: string;
}

export function TaskFormModal({ open, onClose, task, projectId }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const projects = useProjectOptions();
  const saving = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(taskCreateSchema) });

  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? {
            projectId: task.projectId,
            name: task.name,
            description: task.description ?? '',
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate ?? '',
          }
        : {
            projectId: projectId ?? '',
            name: '',
            description: '',
            priority: 'MEDIUM',
            status: 'PENDING',
            dueDate: '',
          },
    );
  }, [open, task, projectId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (task) await update.mutateAsync({ id: task.id, input: values });
      else await create.mutateAsync(values);
      toast.success(task ? 'Task updated' : 'Task created');
      onClose();
    } catch (err) {
      if (!applyServerErrors(err, setError)) toast.error(getErrorMessage(err));
    }
  });

  const projectOptions = [
    { value: '', label: projects.isLoading ? 'Loading projects…' : 'Select a project' },
    ...(projects.data?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      {/* Wait for the project list so the project <select> can show the stored value. */}
      {projects.isLoading ? (
        <div className="flex justify-center py-10 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
      <form id="task-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Task name" autoFocus maxLength={150} error={errors.name?.message} {...register('name')} />
        <TextAreaField
          label="Description"
          maxLength={2000}
          error={errors.description?.message}
          {...register('description')}
        />
        <SelectField
          label="Project"
          options={projectOptions}
          error={errors.projectId ? 'Please choose a project' : undefined}
          {...register('projectId')}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Priority"
            options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
            error={errors.priority?.message}
            {...register('priority')}
          />
          <SelectField
            label="Status"
            options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            error={errors.status?.message}
            {...register('status')}
          />
          <TextField label="Due date" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
        </div>
      </form>
      )}
    </Modal>
  );
}
