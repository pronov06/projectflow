import clsx from 'clsx';
import { AlertTriangle, ChevronLeft, ChevronRight, Sprout } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PaginationMeta } from '@pms/shared';
import { getErrorMessage } from '../../lib/errors';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-line bg-surface-warm px-24 py-48 text-center">
      <span className="flex size-48 items-center justify-center rounded-icon bg-accent-soft text-ink-brand">
        <Sprout className="size-24" aria-hidden="true" />
      </span>
      <h3 className="mt-16 text-subheading text-ink-brand">{title}</h3>
      {description && <p className="mt-6 max-w-form text-body text-ink-muted">{description}</p>}
      {action && <div className="mt-20">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-card border border-danger/30 bg-danger-soft px-24 py-40 text-center"
    >
      <AlertTriangle className="size-32 text-danger" aria-hidden="true" />
      <p className="mt-12 max-w-form text-body text-danger">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-16" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Pagination({ meta, onPage }: { meta?: PaginationMeta; onPage: (page: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between pt-20 text-body text-ink-muted" aria-label="Pagination">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} items
      </span>
      <div className="flex gap-8">
        <Button
          variant="secondary"
          size="icon"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-16" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-16" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-32 flex flex-col gap-16 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-heading-sm text-ink-brand lg:text-heading">{title}</h1>
        {description && <div className="mt-6 text-body-lg text-ink-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 gap-8">{actions}</div>}
    </div>
  );
}

/** Light content card: paper fill, stone hairline, card radius. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-card border border-line bg-surface', className)}>{children}</div>;
}
