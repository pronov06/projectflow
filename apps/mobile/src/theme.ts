import type { ProjectStatus, TaskPriority, TaskStatus } from '@pms/shared';

export const colors = {
  brand: '#4F46E5',
  brandDark: '#4338CA',
  brandSoft: '#EEF2FF',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
  success: '#047857',
};

export const statusColors: Record<ProjectStatus | TaskStatus, { bg: string; fg: string }> = {
  NOT_STARTED: { bg: '#F1F5F9', fg: '#334155' },
  PENDING: { bg: '#FFFBEB', fg: '#92400E' },
  IN_PROGRESS: { bg: '#EFF6FF', fg: '#1D4ED8' },
  COMPLETED: { bg: '#ECFDF5', fg: '#047857' },
};

export const priorityColors: Record<TaskPriority, { bg: string; fg: string }> = {
  LOW: { bg: '#F8FAFC', fg: '#475569' },
  MEDIUM: { bg: '#FFF7ED', fg: '#C2410C' },
  HIGH: { bg: '#FEF2F2', fg: '#B91C1C' },
};

export const radius = 12;
