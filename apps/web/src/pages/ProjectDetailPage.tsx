import { AxiosError } from 'axios';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDeleteProject, useProject } from '../api/hooks';
import { ProgressBar, ProjectStatusBadge } from '../components/ui/Badges';
import { Button, buttonClasses } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { ProjectFormModal } from '../features/projects/ProjectFormModal';
import { TaskBrowser } from '../features/tasks/TaskBrowser';
import { getErrorMessage } from '../lib/errors';
import { formatDate } from '../lib/format';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const remove = useDeleteProject();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-16">
        <Skeleton className="h-40" />
        <Skeleton className="h-160" />
        <Skeleton className="h-160" />
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
          <Link to="/projects" className={buttonClasses('secondary')}>
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

  const facts = [
    ['Start date', formatDate(project.startDate)],
    ['End date', formatDate(project.endDate)],
    ['Created', formatDate(project.createdAt)],
    ['Tasks done', `${project.completedTaskCount} / ${project.taskCount}`],
  ];

  return (
    <>
      <Link to="/projects" className={buttonClasses('quiet', 'sm', 'mb-16 -ml-14')}>
        <ArrowLeft className="size-16" aria-hidden="true" /> All projects
      </Link>

      {/* Project hero: forest panel, the app-side echo of the auth screen's notched panel. */}
      <section className="mb-32 rounded-panel bg-panel p-24 text-on-panel sm:p-32">
        <div className="flex flex-col gap-16 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-12">
              <h1 className="text-heading-sm break-words lg:text-heading">{project.name}</h1>
              <ProjectStatusBadge status={project.status} onPanel />
            </div>
            <p className="mt-8 max-w-prose whitespace-pre-line text-body-lg text-on-panel-muted">
              {project.description ?? 'No description'}
            </p>
          </div>
          <div className="flex shrink-0 gap-8">
            <Button variant="inverse" onClick={() => setEditing(true)}>
              <Pencil className="size-16" aria-hidden="true" /> Edit
            </Button>
            <Button variant="inverse" onClick={() => setDeleting(true)} aria-label="Delete project">
              <Trash2 className="size-16" aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>
        <dl className="mt-24 grid grid-cols-2 gap-16 border-t border-on-panel/15 pt-20 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-label text-on-panel-muted">{label}</dt>
              <dd className="mt-2 text-body-lg">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-20">
          <ProgressBar value={project.progress} label="Project progress" tone="dark" />
          <p className="mt-6 text-label text-on-panel-muted">{project.progress}% complete</p>
        </div>
      </section>

      <h2 className="mb-16 text-subheading text-ink-brand">Tasks</h2>
      <TaskBrowser projectId={project.id} />

      <ProjectFormModal open={editing} project={project} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={deleting}
        title="Delete project?"
        message={
          <>
            <span className="text-ink">{project.name}</span> and all of its {project.taskCount} task(s) will be permanently
            deleted.
          </>
        }
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
