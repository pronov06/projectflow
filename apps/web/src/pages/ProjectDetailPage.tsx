import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDeleteProject, useProject } from '../api/hooks';
import { ProjectFormModal } from '../features/projects/ProjectFormModal';
import { TaskBrowser } from '../features/tasks/TaskBrowser';
import { ProgressBar, ProjectStatusBadge } from '../components/ui/Badges';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { getErrorMessage } from '../lib/errors';
import { formatDate } from '../lib/format';
import { AxiosError } from 'axios';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const remove = useDeleteProject();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-36" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !project) {
    const notFound = error instanceof AxiosError && [400, 404].includes(error.response?.status ?? 0);
    return notFound ? (
      <EmptyState
        title="Project not found"
        description="It may have been deleted, or you don't have access to it."
        action={
          <Link to="/projects" className="text-sm font-medium text-brand-700 hover:underline">
            Back to projects
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => refetch()} />
    );
  }

  const confirmDelete = () =>
    remove.mutate(project.id, {
      onSuccess: () => {
        toast.success('Project deleted');
        navigate('/projects', { replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  return (
    <>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All projects
      </Link>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{project.description ?? 'No description'}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </Button>
            <Button variant="secondary" onClick={() => setDeleting(true)} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Start date</dt>
            <dd className="font-medium text-slate-900">{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">End date</dt>
            <dd className="font-medium text-slate-900">{formatDate(project.endDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd className="font-medium text-slate-900">{formatDate(project.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tasks done</dt>
            <dd className="font-medium text-slate-900">
              {project.completedTaskCount} / {project.taskCount}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <ProgressBar value={project.progress} label="Project progress" />
          <p className="mt-1 text-xs text-slate-500">{project.progress}% complete</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Tasks</h2>
      <TaskBrowser projectId={project.id} />

      <ProjectFormModal open={editing} project={project} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={deleting}
        title="Delete project?"
        message={
          <>
            <strong>{project.name}</strong> and all of its {project.taskCount} task(s) will be permanently deleted.
          </>
        }
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
