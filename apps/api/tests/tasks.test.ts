import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, createProject, createTask, createUser, MISSING_ID, resetDb, type TestUser } from './helpers';

let user: TestUser;
let projectId: string;

beforeEach(async () => {
  await resetDb();
  user = await createUser();
  projectId = (await createProject(user, { name: 'Main' })).id;
});
afterAll(() => prisma.$disconnect());

describe('tasks CRUD', () => {
  it('creates a task with defaults and the parent project', async () => {
    const res = await api()
      .post('/api/tasks')
      .set(user.auth)
      .send({ projectId, name: 'Write docs', dueDate: '2026-10-20' })
      .expect(201);
    expect(res.body.data).toMatchObject({
      name: 'Write docs',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '2026-10-20',
      completedAt: null,
      project: { id: projectId, name: 'Main' },
    });
  });

  it('marks a task completed and back, maintaining completedAt', async () => {
    const t = await createTask(user, projectId);
    const done = await api()
      .put(`/api/tasks/${t.id}`)
      .set(user.auth)
      .send({ status: 'COMPLETED' })
      .expect(200);
    expect(done.body.data.completedAt).toEqual(expect.any(String));

    const reopened = await api()
      .put(`/api/tasks/${t.id}`)
      .set(user.auth)
      .send({ status: 'IN_PROGRESS', priority: 'HIGH' })
      .expect(200);
    expect(reopened.body.data).toMatchObject({ status: 'IN_PROGRESS', priority: 'HIGH', completedAt: null });
  });

  it('gets and deletes a task', async () => {
    const t = await createTask(user, projectId, { name: 'Temp' });
    await api().get(`/api/tasks/${t.id}`).set(user.auth).expect(200);
    await api().delete(`/api/tasks/${t.id}`).set(user.auth).expect(204);
    await api().get(`/api/tasks/${t.id}`).set(user.auth).expect(404);
  });

  it('moves a task to another of my projects', async () => {
    const other = await createProject(user, { name: 'Other' });
    const t = await createTask(user, projectId);
    const res = await api()
      .put(`/api/tasks/${t.id}`)
      .set(user.auth)
      .send({ projectId: other.id })
      .expect(200);
    expect(res.body.data.project.name).toBe('Other');
  });

  it('returns 404 for missing tasks or projects', async () => {
    await api().get(`/api/tasks/${MISSING_ID}`).set(user.auth).expect(404);
    await api().post('/api/tasks').set(user.auth).send({ projectId: MISSING_ID, name: 'x' }).expect(404);
  });
});

describe('task validation', () => {
  it('requires a valid projectId', async () => {
    for (const body of [{ name: 'x' }, { projectId: 'abc', name: 'x' }]) {
      const res = await api().post('/api/tasks').set(user.auth).send(body).expect(400);
      expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain('projectId');
    }
  });

  it.each([
    [{ name: '' }, 'name'],
    [{ name: 'x', priority: 'URGENT' }, 'priority'],
    [{ name: 'x', status: 'DONE' }, 'status'],
    [{ name: 'x', dueDate: '2026-02-30' }, 'dueDate'],
    [{ name: 'x', dueDate: 'next week' }, 'dueDate'],
  ])('rejects %j', async (body, field) => {
    const res = await api()
      .post('/api/tasks')
      .set(user.auth)
      .send({ projectId, ...body })
      .expect(400);
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
  });
});

describe('task listing', () => {
  beforeEach(async () => {
    const second = await createProject(user, { name: 'Second' });
    await createTask(user, projectId, { name: 'Fix login bug', priority: 'HIGH', status: 'PENDING' });
    await createTask(user, projectId, { name: 'Write tests', priority: 'LOW', status: 'COMPLETED' });
    await createTask(user, second.id, { name: 'Fix layout', priority: 'MEDIUM', status: 'IN_PROGRESS' });
  });

  it('lists all my tasks or only one project', async () => {
    const all = await api().get('/api/tasks').set(user.auth).expect(200);
    expect(all.body.meta.total).toBe(3);
    const one = await api().get(`/api/tasks?projectId=${projectId}`).set(user.auth).expect(200);
    expect(one.body.meta.total).toBe(2);
  });

  it('searches, filters by status and priority', async () => {
    const search = await api().get('/api/tasks?search=fix').set(user.auth).expect(200);
    expect(search.body.data).toHaveLength(2);
    const status = await api().get('/api/tasks?status=COMPLETED').set(user.auth).expect(200);
    expect(status.body.data.map((t: { name: string }) => t.name)).toEqual(['Write tests']);
    const prio = await api().get('/api/tasks?priority=HIGH&search=fix').set(user.auth).expect(200);
    expect(prio.body.data.map((t: { name: string }) => t.name)).toEqual(['Fix login bug']);
  });

  it('sorts by priority (HIGH first when descending)', async () => {
    const res = await api().get('/api/tasks?sortBy=priority&order=desc').set(user.auth).expect(200);
    expect(res.body.data.map((t: { priority: string }) => t.priority)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
  });
});
