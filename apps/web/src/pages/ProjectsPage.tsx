import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@pms/shared';
import { useProjects } from '../api/hooks';
import { ProjectFormModal } from '../features/projects/ProjectFormModal';
import { SearchInput } from '../components/SearchInput';
import { ProgressBar, ProjectStatusBadge } from '../components/ui/Badges';
import { Button } from '../components/ui/Button';
import { FilterSelect } from '../components/ui/Field';
import { Skeleton } from '../components/ui/Spinner';
import { EmptyState, ErrorState, PageHeader, Pagination } from '../components/ui/States';
import { useUrlState } from '../hooks/useUrlState';
import { formatDate } from '../lib/format';

const FILTER_KEYS = ['search', 'status', 'sortBy', 'page'] as const;

const SORTS = [
  { value: '', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name (A–Z)' },
  { value: 'endDate:asc', label: 'End date (soonest)' },
];

export function ProjectsPage() {
  const [f, set] = useUrlState(FILTER_KEYS);
  const [creating, setCreating] = useState(false);
  const [sortBy, order] = f.sortBy ? f.sortBy.split(':') : [];

  const query = useProjects({
    search: f.search,
    status: f.status,
    sortBy,
    order,
    page: Number(f.page) || 1,
    limit: 12,
  });
  const filtered = !!(f.search || f.status);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Everything you're working on."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New project
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          label="Search projects"
          placeholder="Search projects by name…"
          value={f.search}
          onChange={(v) => set('search', v)}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <FilterSelect
            label="Filter by status"
            value={f.status}
            onChange={(v) => set('status', v)}
            options={[
              { value: '', label: 'All statuses' },
              ...PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] })),
            ]}
          />
          <FilterSelect label="Sort projects" value={f.sortBy} onChange={(v) => set('sortBy', v)} options={SORTS} />
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data?.data.length === 0 ? (
        <EmptyState
          title={filtered ? 'No projects match your filters' : 'No projects yet'}
          description={
            filtered ? 'Try a different search or clear the filters.' : 'Create a project to start organising your tasks.'
          }
          action={
            !filtered && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New project
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data?.data.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/projects/${p.id}`}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 font-semibold text-slate-900">{p.name}</h2>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{p.description ?? 'No description'}</p>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>
                        {p.completedTaskCount}/{p.taskCount} tasks done
                      </span>
                      <span>{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} label={`${p.name} progress`} />
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(p.startDate)} – {formatDate(p.endDate)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination meta={query.data?.meta} onPage={(p) => set('page', String(p))} />
        </>
      )}

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
