import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api } from './helpers';

afterAll(() => prisma.$disconnect());

describe('HTTP hardening', () => {
  it('sets security headers and hides the framework', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('allows the configured web origin and refuses others', async () => {
    const allowed = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const denied = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns JSON 404s for unknown routes', async () => {
    const res = await api().get('/api/nope').expect(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('rejects malformed and oversized JSON bodies cleanly', async () => {
    const bad = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(bad.body.error.message).toMatch(/Malformed JSON/);

    await api()
      .post('/api/auth/register')
      .send({ fullName: 'x'.repeat(200_000), email: 'a@example.com', password: 'Password1' })
      .expect(413);
  });

  it('serves the OpenAPI docs', async () => {
    const res = await api().get('/api/docs.json').expect(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/api/auth/login', '/api/projects/{id}', '/api/tasks', '/api/dashboard']),
    );
  });
});
