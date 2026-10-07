import request from 'supertest';
import type { AuthResponse } from '@pms/shared';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

export const app = createApp();
export const api = () => request(app);

let counter = 0;

export async function resetDb() {
  await prisma.$executeRaw`TRUNCATE TABLE "audit_logs", "refresh_tokens", "tasks", "projects", "users" CASCADE`;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  refreshToken: string;
  auth: { Authorization: string };
}

/** Registers a fresh user as a native client (so the refresh token comes back in the body). */
export async function createUser(name = 'Test User'): Promise<TestUser> {
  counter += 1;
  const email = `user${counter}-${Date.now()}@example.com`;
  const password = 'Password123';
  const res = await api()
    .post('/api/auth/register')
    .set('X-Client-Platform', 'mobile')
    .send({ fullName: name, email, password })
    .expect(201);
  const data = res.body.data as AuthResponse;
  return {
    id: data.user.id,
    email,
    password,
    token: data.accessToken,
    refreshToken: data.refreshToken!,
    auth: { Authorization: `Bearer ${data.accessToken}` },
  };
}

export async function createProject(user: TestUser, body: Record<string, unknown> = {}) {
  const res = await api()
    .post('/api/projects')
    .set(user.auth)
    .send({ name: 'Project', ...body })
    .expect(201);
  return res.body.data as { id: string; name: string };
}

export async function createTask(user: TestUser, projectId: string, body: Record<string, unknown> = {}) {
  const res = await api()
    .post('/api/tasks')
    .set(user.auth)
    .send({ projectId, name: 'Task', ...body })
    .expect(201);
  return res.body.data as { id: string; name: string; status: string };
}

export const MISSING_ID = '00000000-0000-4000-8000-000000000000';
