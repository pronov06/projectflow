import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, createProject, createTask, createUser, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('GET /api/dashboard', () => {
  it('returns zeros for a new user', async () => {
    const user = await createUser();
    const res = await api().get('/api/dashboard').set(user.auth).expect(200);
    expect(res.body.data).toMatchObject({
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      projectsInProgress: 0,
      overdueTasks: 0,
    });
  });

  it('computes exact counts for a known dataset', async () => {
    const user = await createUser();
    const p1 = await createProject(user, { status: 'IN_PROGRESS' });
    const p2 = await createProject(user, { status: 'IN_PROGRESS' });
    await createProject(user, { status: 'COMPLETED' });

    await createTask(user, p1.id, { status: 'COMPLETED', priority: 'HIGH' });
    await createTask(user, p1.id, { status: 'PENDING', priority: 'HIGH', dueDate: '2020-01-01' });
    await createTask(user, p2.id, { status: 'PENDING', priority: 'LOW' });
    await createTask(user, p2.id, { status: 'IN_PROGRESS', priority: 'MEDIUM' });
    await createTask(user, p2.id, { status: 'COMPLETED', priority: 'MEDIUM', dueDate: '2020-01-01' });

    const res = await api().get('/api/dashboard').set(user.auth).expect(200);
    expect(res.body.data).toEqual({
      totalProjects: 3,
      totalTasks: 5,
      completedTasks: 2,
      pendingTasks: 2,
      inProgressTasks: 1,
      projectsInProgress: 2,
      // completed tasks are never overdue
      overdueTasks: 1,
      projectsByStatus: { NOT_STARTED: 0, IN_PROGRESS: 2, COMPLETED: 1 },
      tasksByStatus: { PENDING: 2, IN_PROGRESS: 1, COMPLETED: 2 },
      tasksByPriority: { LOW: 1, MEDIUM: 2, HIGH: 2 },
    });
  });

  it('requires authentication', async () => {
    await api().get('/api/dashboard').expect(401);
  });
});
