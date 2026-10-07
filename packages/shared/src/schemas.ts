import { z } from 'zod';
import { PROJECT_STATUSES, TASK_PRIORITIES, TASK_STATUSES } from './enums';

/* ----------------------------- primitives ----------------------------- */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a real calendar date in YYYY-MM-DD form (rejects 2025-02-30). */
export function isValidDateOnly(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Calendar date (no time) as `YYYY-MM-DD`. */
export const dateOnlySchema = z
  .string({ error: 'Date must be a string in YYYY-MM-DD format' })
  .trim()
  .refine(isValidDateOnly, { error: 'Invalid date (expected a real date in YYYY-MM-DD format)' });

/** Optional date: `null` clears it, `""` (empty form field) is treated as `null`. */
const optionalDate = z
  .union([z.literal(''), dateOnlySchema])
  .nullable()
  .optional()
  .transform((v) => (v === '' ? null : v));

/** Optional free text: trims, turns "" into null so the DB never stores empty strings. */
const optionalText = (max: number) =>
  z
    .string({ error: 'Must be a string' })
    .trim()
    .max(max, { error: `Must be at most ${max} characters` })
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v));

const requiredName = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, { error: `${label} is required` })
    .max(max, { error: `${label} must be at most ${max} characters` });

export const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'Email is required' })
  .max(255, { error: 'Email must be at most 255 characters' })
  .pipe(z.email({ error: 'Invalid email address' }));

export const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(72, { error: 'Password must be at most 72 characters' })
  .regex(/[A-Za-z]/, { error: 'Password must contain at least one letter' })
  .regex(/\d/, { error: 'Password must contain at least one number' });

export const uuidSchema = z.uuid({ error: 'Invalid id' });

export const idParamSchema = z.object({ id: uuidSchema });

/* -------------------------------- auth -------------------------------- */

export const registerSchema = z.object({
  fullName: requiredName('Full name', 100).refine((v) => v.length >= 2, {
    error: 'Full name must be at least 2 characters',
  }),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Password is required' })
    .min(1, { error: 'Password is required' })
    .max(72, { error: 'Password must be at most 72 characters' }),
});

/** Native clients send the refresh token in the body; web relies on the httpOnly cookie. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(512).optional(),
});

/* ------------------------------ projects ------------------------------ */

const endAfterStart = (v: { startDate?: string | null; endDate?: string | null }) =>
  !v.startDate || !v.endDate || v.endDate >= v.startDate;
const endAfterStartIssue = {
  error: 'End date cannot be before start date',
  path: ['endDate'],
};

const projectStatus = z.enum(PROJECT_STATUSES, {
  error: `Status must be one of: ${PROJECT_STATUSES.join(', ')}`,
});

const projectFields = {
  name: requiredName('Project name', 120),
  description: optionalText(2000),
  status: projectStatus,
  startDate: optionalDate,
  endDate: optionalDate,
};

export const projectCreateSchema = z
  .object({ ...projectFields, status: projectStatus.default('NOT_STARTED') })
  .refine(endAfterStart, endAfterStartIssue);

export const projectUpdateSchema = z
  .object(projectFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { error: 'Provide at least one field to update' })
  .refine(endAfterStart, endAfterStartIssue);

/* -------------------------------- tasks ------------------------------- */

const taskPriority = z.enum(TASK_PRIORITIES, {
  error: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
});
const taskStatus = z.enum(TASK_STATUSES, {
  error: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
});

const taskFields = {
  projectId: uuidSchema,
  name: requiredName('Task name', 150),
  description: optionalText(2000),
  priority: taskPriority,
  status: taskStatus,
  dueDate: optionalDate,
};

export const taskCreateSchema = z.object({
  ...taskFields,
  priority: taskPriority.default('MEDIUM'),
  status: taskStatus.default('PENDING'),
});

export const taskUpdateSchema = z
  .object(taskFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { error: 'Provide at least one field to update' });

/* ---------------------------- list queries ---------------------------- */

export const PROJECT_SORT_FIELDS = ['createdAt', 'name', 'startDate', 'endDate', 'status'] as const;
export const TASK_SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'status', 'name'] as const;
export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

const paginationFields = {
  page: z.coerce.number({ error: 'page must be a number' }).int().min(1).max(10_000).default(1),
  limit: z.coerce.number({ error: 'limit must be a number' }).int().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc'], { error: 'order must be asc or desc' }).default('desc'),
  search: z
    .string()
    .trim()
    .max(100, { error: 'search must be at most 100 characters' })
    .optional()
    .transform((v) => (v ? v : undefined)),
};

export const projectListQuerySchema = z.object({
  ...paginationFields,
  status: projectStatus.optional(),
  sortBy: z
    .enum(PROJECT_SORT_FIELDS, {
      error: `sortBy must be one of: ${PROJECT_SORT_FIELDS.join(', ')}`,
    })
    .default('createdAt'),
});

export const taskListQuerySchema = z.object({
  ...paginationFields,
  projectId: uuidSchema.optional(),
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
  sortBy: z
    .enum(TASK_SORT_FIELDS, { error: `sortBy must be one of: ${TASK_SORT_FIELDS.join(', ')}` })
    .default('createdAt'),
});

/* ------------------------------- types -------------------------------- */

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type ProjectCreateInput = z.input<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.input<typeof projectUpdateSchema>;
export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;
export type ProjectCreateData = z.output<typeof projectCreateSchema>;
export type ProjectUpdateData = z.output<typeof projectUpdateSchema>;
export type TaskCreateData = z.output<typeof taskCreateSchema>;
export type TaskUpdateData = z.output<typeof taskUpdateSchema>;
export type ProjectListQuery = z.output<typeof projectListQuerySchema>;
export type TaskListQuery = z.output<typeof taskListQuerySchema>;
