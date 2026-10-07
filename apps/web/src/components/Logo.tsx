import clsx from 'clsx';

/**
 * ProjectFlow mark: three stepped blocks joined into a path — a project "flowing" through stages.
 * `tone="dark"` renders on cream (forest mark), `tone="light"` renders on forest panels (mint mark).
 */
export function Logo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-10', className)}>
      <svg
        viewBox="0 0 32 32"
        className={clsx('size-32', tone === 'dark' ? 'text-ink-brand' : 'text-accent')}
        aria-hidden="true"
      >
        <rect x="2" y="2" width="14" height="9" rx="2.5" fill="currentColor" />
        <rect x="9" y="11.5" width="14" height="9" rx="2.5" fill="currentColor" />
        <rect x="16" y="21" width="14" height="9" rx="2.5" fill="currentColor" />
      </svg>
      <span
        className={clsx('text-subheading', tone === 'dark' ? 'text-ink-brand' : 'text-on-panel')}
      >
        ProjectFlow
      </span>
    </span>
  );
}
