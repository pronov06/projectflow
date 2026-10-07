import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from '@pms/shared';
import { useTasks } from '../../api/hooks';
import { SearchInput } from '../../components/SearchInput';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Spinner';
import { EmptyState, ErrorState, Pagination } from '../../components/ui/States';
import { useUrlState } from '../../hooks/useUrlState';
import { TaskFormModal } from './TaskFormModal';
import { TaskList } from './TaskList';

const FILTER_KEYS = ['search', 'status', 'priority', 'sortBy', 'page'] as const;

const SORTS = [
  { value: '', label: 'Newest first' },
  { value: 'dueDate:asc', label: 'Due date (soonest)' },
  { value: 'priority:desc', label: 'Priority (high first)' },
  { value: 'name:asc', label: 'Name (A–Z)' },
];

/** Searchable, filterable, paginated task list — used on the Tasks page and on each project page. */
export function TaskBrowser({ projectId }: { projectId?: string }) {
  const [f, set] = useUrlState(FILTER_KEYS);
  const [creating, setCreating] = useState(false);
  const [sortBy, order] = f.sortBy ? f.sortBy.split(':') : [];

  const query = useTasks({
    projectId,
    search: f.search,
    status: f.status,
    priority: f.priority,
    sortBy,
    order,
    page: Number(f.page) || 1,
    limit: 20,
  });

  const filtered = !!(f.search || f.status || f.priority);

  return (
    <section aria-label="Tasks">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <SearchInput
          label="Search tasks"
          placeholder="Search tasks by name…"
          value={f.search}
          onChange={(v) => set('search', v)}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex">
          <FilterSelect
            label="Filter by status"
            value={f.status}
            onChange={(v) => set('status', v)}
            options={[{ value: '', label: 'All statuses' }, ...TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))]}
          />
          <FilterSelect
            label="Filter by priority"
            value={f.priority}
            onChange={(v) => set('priority', v)}
            options={[
              { value: '', label: 'All priorities' },
              ...TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] })),
            ]}
          />
          <FilterSelect label="Sort tasks" value={f.sortBy} onChange={(v) => set('sortBy', v)} options={SORTS} />
        </div>
        <Button onClick={() => setCreating(true)} className="md:ml-auto">
          <Plus className="h-4 w-4" aria-hidden="true" /> New task
        </Button>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data?.data.length === 0 ? (
        <EmptyState
          title={filtered ? 'No tasks match your filters' : 'No tasks yet'}
          description={filtered ? 'Try a different search or clear the filters.' : 'Create your first task to get started.'}
          action={
            !filtered && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New task
              </Button>
            )
          }
        />
      ) : (
        <>
          <TaskList tasks={query.data?.data ?? []} showProject={!projectId} />
          <Pagination meta={query.data?.meta} onPage={(p) => set('page', String(p))} />
        </>
      )}

      <TaskFormModal open={creating} projectId={projectId} onClose={() => setCreating(false)} />
    </section>
  );
}
