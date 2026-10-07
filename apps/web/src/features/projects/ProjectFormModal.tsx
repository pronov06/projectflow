import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, projectCreateSchema, type Project } from '@pms/shared';
import { useCreateProject, useUpdateProject } from '../../api/hooks';
import { Button } from '../../components/ui/Button';
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { applyServerErrors, getErrorMessage } from '../../lib/errors';

type FormIn = z.input<typeof projectCreateSchema>;
type FormOut = z.output<typeof projectCreateSchema>;

const empty: FormIn = { name: '', description: '', status: 'NOT_STARTED', startDate: '', endDate: '' };

interface Props {
  open: boolean;
  onClose: () => void;
  /** When given, the form edits this project; otherwise it creates one. */
  project?: Project;
  onSaved?: (project: Project) => void;
}

export function ProjectFormModal({ open, onClose, project, onSaved }: Props) {
  const create = useCreateProject();
  const update = useUpdateProject();
  const saving = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(projectCreateSchema), defaultValues: empty });

  useEffect(() => {
    if (!open) return;
    reset(
      project
        ? {
            name: project.name,
            description: project.description ?? '',
            status: project.status,
            startDate: project.startDate ?? '',
            endDate: project.endDate ?? '',
          }
        : empty,
    );
  }, [open, project, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = project
        ? await update.mutateAsync({ id: project.id, input: values })
        : await create.mutateAsync(values);
      toast.success(project ? 'Project updated' : 'Project created');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      if (!applyServerErrors(err, setError)) toast.error(getErrorMessage(err));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'New project'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={saving}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Project name" autoFocus maxLength={120} error={errors.name?.message} {...register('name')} />
        <TextAreaField
          label="Description"
          maxLength={2000}
          error={errors.description?.message}
          {...register('description')}
        />
        <SelectField
          label="Status"
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
          error={errors.status?.message}
          {...register('status')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <TextField label="End date" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>
      </form>
    </Modal>
  );
}
