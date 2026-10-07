import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, createProject, createTask, createUser, MISSING_ID, resetDb, type TestUser } from './helpers';

let user: TestUser;

beforeEach(async () => {
  await resetDb();
  user = await createUser();
});
afterAll(() => prisma.$disconnect());

describe('projects CRUD', () => {
  it('creates a project with defaults', async () => {
    const res = await api()
      .post('/api/projects')
      .set(user.auth)
      .send({ name: '  Website  ', description: '', startDate: '2026-10-01', endDate: '2026-12-31' })
      .expect(201);
    expect(res.body.data).toMatchObject({
      name: 'Website',
      description: null,
      status: 'NOT_STARTED',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      taskCount: 0,
      progress: 0,
    });
    expect(res.body.data.createdAt).toEqual(expect.any(String));
  });

  it('gets project details with task progress', async () => {
    const p = await createProject(user);
    await createTask(user, p.id, { status: 'COMPLETED' });
    await createTask(user, p.id);
    await createTask(user, p.id);
    await createTask(user, p.id);
    const res = await api().get(`/api/projects/${p.id}`).set(user.auth).expect(200);
    expect(res.body.data).toMatchObject({ taskCount: 4, completedTaskCount: 1, progress: 25 });
  });

  it('updates only the fields sent (partial PUT)', async () => {
    const p = await createProject(user, { name: 'Old', description: 'Keep me' });
    const res = await api()
      .put(`/api/projects/${p.id}`)
      .set(user.auth)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    expect(res.body.data).toMatchObject({ name: 'Old', description: 'Keep me', status: 'IN_PROGRESS' });
  });

  it('deletes a project and cascades to its tasks', async () => {
    const p = await createProject(user);
    const t = await createTask(user, p.id);
    await api().delete(`/api/projects/${p.id}`).set(user.auth).expect(204);
    await api().get(`/api/projects/${p.id}`).set(user.auth).expect(404);
    expect(await prisma.task.findUnique({ where: { id: t.id } })).toBeNull();
  });

  it('returns 404 for a project that does not exist', async () => {
    await api().get(`/api/projects/${MISSING_ID}`).set(user.auth).expect(404);
    await api().put(`/api/projects/${MISSING_ID}`).set(user.auth).send({ name: 'x' }).expect(404);
    await api().delete(`/api/projects/${MISSING_ID}`).set(user.auth).expect(404);
  });

  it('requires authentication', async () => {
    await api().get('/api/projects').expect(401);
    await api().post('/api/projects').send({ name: 'x' }).expect(401);
  });
});

describe('project validation', () => {
  it.each([
    [{}, 'name'],
    [{ name: '' }, 'name'],
    [{ name: '   ' }, 'name'],
    [{ name: 'x'.repeat(121) }, 'name'],
    [{ name: 'x', status: 'DONE' }, 'status'],
    [{ name: 'x', startDate: '2026-13-01' }, 'startDate'],
    [{ name: 'x', startDate: 'tomorrow' }, 'startDate'],
    [{ name: 'x', startDate: '2026-05-10', endDate: '2026-05-01' }, 'endDate'],
  ])('rejects %j', async (body, field) => {
    const res = await api().post('/api/projects').set(user.auth).send(body).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
  });

  it('checks the date range against stored values on partial update', async () => {
    const p = await createProject(user, { startDate: '2026-05-10' });
    const res = await api()
      .put(`/api/projects/${p.id}`)
      .set(user.auth)
      .send({ endDate: '2026-05-01' })
      .expect(400);
    expect(res.body.error.details[0].field).toBe('endDate');
  });

  it('rejects an empty update and an invalid id', async () => {
    const p = await createProject(user);
    await api().put(`/api/projects/${p.id}`).set(user.auth).send({}).expect(400);
    await api().get('/api/projects/123').set(user.auth).expect(400);
  });
});

describe('project listing', () => {
  beforeEach(async () => {
    await createProject(user, { name: 'Alpha Website', status: 'IN_PROGRESS' });
    await createProject(user, { name: 'Beta Mobile', status: 'NOT_STARTED' });
    await createProject(user, { name: 'Gamma website v2', status: 'COMPLETED' });
  });

  it('searches by name, case-insensitively', async () => {
    const res = await api().get('/api/projects?search=WEBSITE').set(user.auth).expect(200);
    expect(res.body.data.map((p: { name: string }) => p.name).sort()).toEqual([
      'Alpha Website',
      'Gamma website v2',
    ]);
  });

  it('filters by status', async () => {
    const res = await api().get('/api/projects?status=COMPLETED').set(user.auth).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Gamma website v2');
  });

  it('paginates and sorts', async () => {
    const res = await api()
      .get('/api/projects?sortBy=name&order=asc&limit=2&page=2')
      .set(user.auth)
      .expect(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['Gamma website v2']);
  });

  it('rejects unknown sort fields and bad filters', async () => {
    await api().get('/api/projects?sortBy=ownerId').set(user.auth).expect(400);
    await api().get('/api/projects?status=nope').set(user.auth).expect(400);
    await api().get('/api/projects?limit=1000').set(user.auth).expect(400);
  });

  it('treats SQL injection attempts as plain text', async () => {
    const res = await api()
      .get(`/api/projects?search=${encodeURIComponent("' OR 1=1 --")}`)
      .set(user.auth)
      .expect(200);
    expect(res.body.data).toEqual([]);
    expect(await prisma.project.count()).toBe(3);
  });
});
