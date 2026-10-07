import type { Prisma, Project as DbProject } from '@prisma/client';
import type {
  Project,
  ProjectCreateData,
  ProjectListQuery,
  ProjectUpdateData,
} from '@pms/shared';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { fromDbDate, toDbDate } from '../../utils/dates';
import { toSkipTake } from '../../utils/pagination';
import { audit } from '../audit/audit.service';

export function toProjectDto(p: DbProject, taskCount: number, completedTaskCount: number): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    startDate: fromDbDate(p.startDate),
    endDate: fromDbDate(p.endDate),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    taskCount,
    completedTaskCount,
    progress: taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100),
  };
}

/** Completed-task counts for a set of projects, keyed by project id. */
async function completedCounts(projectIds: string[]): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();
  const rows = await prisma.task.groupBy({
    by: ['projectId'],
    where: { projectId: { in: projectIds }, status: 'COMPLETED' },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.projectId, r._count._all]));
}

/** Loads a project only if it belongs to `userId`; otherwise 404 (never reveals other users' data). */
export async function findOwnedProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) throw ApiError.notFound('Project');
  return project;
}

export async function listProjects(userId: string, q: ProjectListQuery) {
  const where: Prisma.ProjectWhereInput = {
    ownerId: userId,
    ...(q.status ? { status: q.status } : {}),
    ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
  };
  const nullable = q.sortBy === 'startDate' || q.sortBy === 'endDate';
  const [rows, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      // Secondary sort on id keeps pagination stable when the primary values tie.
      orderBy: [
        nullable ? { [q.sortBy]: { sort: q.order, nulls: 'last' } } : { [q.sortBy]: q.order },
        { id: 'asc' },
      ],
      ...toSkipTake(q.page, q.limit),
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.project.count({ where }),
  ]);
  const completed = await completedCounts(rows.map((r) => r.id));
  const items = rows.map((r) => toProjectDto(r, r._count.tasks, completed.get(r.id) ?? 0));
  return { items, total };
}

export async function getProject(userId: string, projectId: string): Promise<Project> {
  const project = await findOwnedProject(userId, projectId);
  const [taskCount, completedTaskCount] = await prisma.$transaction([
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: 'COMPLETED' } }),
  ]);
  return toProjectDto(project, taskCount, completedTaskCount);
}

export async function createProject(userId: string, input: ProjectCreateData, ip?: string) {
  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      startDate: toDbDate(input.startDate) ?? null,
      endDate: toDbDate(input.endDate) ?? null,
    },
  });
  audit({ userId, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project.id, ip });
  return toProjectDto(project, 0, 0);
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: ProjectUpdateData,
  ip?: string,
) {
  const existing = await findOwnedProject(userId, projectId);

  // Partial update: validate the date range against the values that will actually be stored.
  const startDate = input.startDate !== undefined ? input.startDate : fromDbDate(existing.startDate);
  const endDate = input.endDate !== undefined ? input.endDate : fromDbDate(existing.endDate);
  if (startDate && endDate && endDate < startDate) {
    throw ApiError.validation([
      { field: 'endDate', message: 'End date cannot be before start date' },
    ]);
  }

  await prisma.project.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      startDate: toDbDate(input.startDate),
      endDate: toDbDate(input.endDate),
    },
  });
  audit({
    userId,
    action: 'PROJECT_UPDATED',
    entityType: 'PROJECT',
    entityId: projectId,
    metadata: { fields: Object.keys(input) },
    ip,
  });
  return getProject(userId, projectId);
}

export async function deleteProject(userId: string, projectId: string, ip?: string) {
  // Scoped delete matches nothing if the project belongs to someone else. Tasks cascade in the DB.
  const { count } = await prisma.project.deleteMany({ where: { id: projectId, ownerId: userId } });
  if (count === 0) throw ApiError.notFound('Project');
  audit({ userId, action: 'PROJECT_DELETED', entityType: 'PROJECT', entityId: projectId, ip });
}
