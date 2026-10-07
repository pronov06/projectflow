import {
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type DashboardStats,
} from '@pms/shared';
import { prisma } from '../../lib/prisma';
import { todayUtc } from '../../utils/dates';

function zeroed<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

/** All numbers are computed in the database and scoped to the authenticated user. */
export async function getDashboard(userId: string): Promise<DashboardStats> {
  const ownTasks = { project: { ownerId: userId } };

  const [projectGroups, statusGroups, priorityGroups, overdueTasks] = await prisma.$transaction([
    prisma.project.groupBy({
      by: ['status'],
      where: { ownerId: userId },
      orderBy: { status: 'asc' },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: ownTasks,
      orderBy: { status: 'asc' },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: ownTasks,
      orderBy: { priority: 'asc' },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: { ...ownTasks, status: { not: 'COMPLETED' }, dueDate: { lt: todayUtc() } },
    }),
  ]);

  const count = (c: unknown) => (typeof c === 'object' && c && '_all' in c ? Number(c._all) : 0);

  const projectsByStatus = zeroed(PROJECT_STATUSES);
  for (const g of projectGroups) projectsByStatus[g.status] = count(g._count);

  const tasksByStatus = zeroed(TASK_STATUSES);
  for (const g of statusGroups) tasksByStatus[g.status] = count(g._count);

  const tasksByPriority = zeroed(TASK_PRIORITIES);
  for (const g of priorityGroups) tasksByPriority[g.priority] = count(g._count);

  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

  return {
    totalProjects: sum(projectsByStatus),
    totalTasks: sum(tasksByStatus),
    completedTasks: tasksByStatus.COMPLETED,
    pendingTasks: tasksByStatus.PENDING,
    inProgressTasks: tasksByStatus.IN_PROGRESS,
    projectsInProgress: projectsByStatus.IN_PROGRESS,
    overdueTasks,
    projectsByStatus,
    tasksByStatus,
    tasksByPriority,
  };
}
