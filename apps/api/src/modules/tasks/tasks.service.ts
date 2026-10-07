import type { Prisma, TaskStatus } from '@prisma/client';
import type { Task, TaskCreateData, TaskListQuery, TaskUpdateData } from '@pms/shared';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { fromDbDate, toDbDate } from '../../utils/dates';
import { toSkipTake } from '../../utils/pagination';
import { audit } from '../audit/audit.service';
import { findOwnedProject } from '../projects/projects.service';

const taskInclude = { project: { select: { id: true, name: true } } } as const;
type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function toTaskDto(t: TaskRow): Task {
  return {
    id: t.id,
    projectId: t.projectId,
    project: t.project,
    name: t.name,
    description: t.description,
    priority: t.priority,
    status: t.status,
    dueDate: fromDbDate(t.dueDate),
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** Tasks have no owner column; ownership is always checked through the parent project. */
const ownedBy = (userId: string): Prisma.TaskWhereInput => ({ project: { ownerId: userId } });

async function findOwnedTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...ownedBy(userId) },
    include: taskInclude,
  });
  if (!task) throw ApiError.notFound('Task');
  return task;
}

/** `completedAt` follows the status: set when a task becomes COMPLETED, cleared when it leaves it. */
function completedAtFor(next: TaskStatus | undefined, previous: TaskStatus | null) {
  if (next === undefined || next === previous) return undefined;
  return next === 'COMPLETED' ? new Date() : null;
}

export async function listTasks(userId: string, q: TaskListQuery) {
  const where: Prisma.TaskWhereInput = {
    ...ownedBy(userId),
    ...(q.projectId ? { projectId: q.projectId } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.priority ? { priority: q.priority } : {}),
    ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: [
        q.sortBy === 'dueDate'
          ? { dueDate: { sort: q.order, nulls: 'last' } }
          : { [q.sortBy]: q.order },
        { id: 'asc' },
      ],
      ...toSkipTake(q.page, q.limit),
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);
  return { items: rows.map(toTaskDto), total };
}

export async function getTask(userId: string, taskId: string): Promise<Task> {
  return toTaskDto(await findOwnedTask(userId, taskId));
}

export async function createTask(userId: string, input: TaskCreateData, ip?: string) {
  // You can only add tasks to your own projects.
  await findOwnedProject(userId, input.projectId);
  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description ?? null,
      priority: input.priority,
      status: input.status,
      dueDate: toDbDate(input.dueDate) ?? null,
      completedAt: input.status === 'COMPLETED' ? new Date() : null,
    },
    include: taskInclude,
  });
  audit({ userId, action: 'TASK_CREATED', entityType: 'TASK', entityId: task.id, ip });
  return toTaskDto(task);
}

export async function updateTask(userId: string, taskId: string, input: TaskUpdateData, ip?: string) {
  const existing = await findOwnedTask(userId, taskId);
  if (input.projectId && input.projectId !== existing.projectId) {
    // Moving a task is only allowed into another project the user owns.
    await findOwnedProject(userId, input.projectId);
  }
  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: toDbDate(input.dueDate),
      completedAt: completedAtFor(input.status, existing.status),
    },
    include: taskInclude,
  });
  audit({
    userId,
    action: 'TASK_UPDATED',
    entityType: 'TASK',
    entityId: taskId,
    metadata: { fields: Object.keys(input) },
    ip,
  });
  return toTaskDto(task);
}

export async function deleteTask(userId: string, taskId: string, ip?: string) {
  const { count } = await prisma.task.deleteMany({ where: { id: taskId, ...ownedBy(userId) } });
  if (count === 0) throw ApiError.notFound('Task');
  audit({ userId, action: 'TASK_DELETED', entityType: 'TASK', entityId: taskId, ip });
}
