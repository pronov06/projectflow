const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Formats a 'YYYY-MM-DD' date (or ISO timestamp) for display without timezone shifts. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '—';
  return dateFmt.format(new Date(y, m - 1, d));
}

export function todayIso(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function isOverdue(dueDate: string | null, status: string) {
  return !!dueDate && status !== 'COMPLETED' && dueDate < todayIso();
}
