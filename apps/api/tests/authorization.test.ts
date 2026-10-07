import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, createProject, createTask, createUser, resetDb, type TestUser } from './helpers';

/**
 * The most important guarantee of the API: a user can never read, change or delete
 * another user's projects or tasks. Foreign resources return 404 so their existence is not leaked.
 */
let alice: TestUser;
let bob: TestUser;
let aliceProject: { id: string };
let aliceTask: { id: string };

beforeEach(async () => {
  await resetDb();
  alice = await createUser('Alice');
  bob = await createUser('Bob');
  aliceProject = await createProject(alice, { name: 'Alice secret project' });
  aliceTask = await createTask(alice, aliceProject.id, { name: 'Alice secret task' });
});
afterAll(() => prisma.$disconnect());

describe("Bob cannot touch Alice's data", () => {
  it('cannot read her project or task', async () => {
    await api().get(`/api/projects/${aliceProject.id}`).set(bob.auth).expect(404);
    await api().get(`/api/tasks/${aliceTask.id}`).set(bob.auth).expect(404);
  });

  it('cannot update her project or task', async () => {
    await api().put(`/api/projects/${aliceProject.id}`).set(bob.auth).send({ name: 'pwned' }).expect(404);
    await api().put(`/api/tasks/${aliceTask.id}`).set(bob.auth).send({ name: 'pwned' }).expect(404);
    const project = await prisma.project.findUniqueOrThrow({ where: { id: aliceProject.id } });
    const task = await prisma.task.findUniqueOrThrow({ where: { id: aliceTask.id } });
    expect(project.name).toBe('Alice secret project');
    expect(task.name).toBe('Alice secret task');
  });

  it('cannot delete her project or task', async () => {
    await api().delete(`/api/projects/${aliceProject.id}`).set(bob.auth).expect(404);
    await api().delete(`/api/tasks/${aliceTask.id}`).set(bob.auth).expect(404);
    expect(await prisma.project.count({ where: { id: aliceProject.id } })).toBe(1);
    expect(await prisma.task.count({ where: { id: aliceTask.id } })).toBe(1);
  });

  it('cannot create a task inside her project', async () => {
    await api()
      .post('/api/tasks')
      .set(bob.auth)
      .send({ projectId: aliceProject.id, name: 'sneaky' })
      .expect(404);
    expect(await prisma.task.count({ where: { projectId: aliceProject.id } })).toBe(1);
  });

  it('cannot move his own task into her project', async () => {
    const bobProject = await createProject(bob);
    const bobTask = await createTask(bob, bobProject.id);
    await api()
      .put(`/api/tasks/${bobTask.id}`)
      .set(bob.auth)
      .send({ projectId: aliceProject.id })
      .expect(404);
  });

  it('never sees her data in lists, filters or the dashboard', async () => {
    const projects = await api().get('/api/projects').set(bob.auth).expect(200);
    expect(projects.body.data).toEqual([]);
    const tasks = await api().get(`/api/tasks?projectId=${aliceProject.id}`).set(bob.auth).expect(200);
    expect(tasks.body.data).toEqual([]);
    const search = await api().get('/api/tasks?search=secret').set(bob.auth).expect(200);
    expect(search.body.data).toEqual([]);
    const dash = await api().get('/api/dashboard').set(bob.auth).expect(200);
    expect(dash.body.data).toMatchObject({ totalProjects: 0, totalTasks: 0 });
  });

  it('cannot take over a project by sending ownerId', async () => {
    const res = await api()
      .post('/api/projects')
      .set(bob.auth)
      .send({ name: 'mine', ownerId: alice.id })
      .expect(201);
    const created = await prisma.project.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(created.ownerId).toBe(bob.id);
  });
});
