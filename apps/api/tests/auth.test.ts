import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { api, createUser, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const valid = { fullName: 'Alice Tester', email: 'alice@example.com', password: 'Password123' };

describe('POST /api/auth/register', () => {
  it('creates a user, returns a token and never exposes the password', async () => {
    const res = await api().post('/api/auth/register').send(valid).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ fullName: 'Alice Tester', email: 'alice@example.com' });
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('Password123');
    expect(raw).not.toMatch(/passwordHash|password_hash/);
  });

  it('stores a bcrypt hash, not the plain password', async () => {
    await api().post('/api/auth/register').send(valid).expect(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: valid.email } });
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user.passwordHash).not.toContain(valid.password);
  });

  it('normalises email case so duplicates are caught', async () => {
    await api().post('/api/auth/register').send(valid).expect(201);
    const res = await api()
      .post('/api/auth/register')
      .send({ ...valid, email: 'ALICE@Example.com' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    [{ ...valid, email: 'not-an-email' }, 'email'],
    [{ ...valid, password: 'short1' }, 'password'],
    [{ ...valid, password: 'lettersonly' }, 'password'],
    [{ ...valid, fullName: '   ' }, 'fullName'],
    [{ email: valid.email, password: valid.password }, 'fullName'],
  ])('rejects invalid input %#', async (body, field) => {
    const res = await api().post('/api/auth/register').send(body).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
  });

  it('ignores attempts to self-assign a role', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...valid, role: 'ADMIN' })
      .expect(201);
    expect(res.body.data.user.role).toBe('USER');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and sets an httpOnly refresh cookie for browsers', async () => {
    await api().post('/api/auth/register').send(valid).expect(201);
    const res = await api()
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password })
      .expect(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toContain('pf_refresh=');
    expect(cookie).toContain('HttpOnly');
  });

  it('returns the refresh token in the body for the mobile app', async () => {
    await api().post('/api/auth/register').send(valid).expect(201);
    const res = await api()
      .post('/api/auth/login')
      .set('X-Client-Platform', 'mobile')
      .send({ email: valid.email, password: valid.password })
      .expect(200);
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('uses the same generic error for wrong password and unknown email', async () => {
    await api().post('/api/auth/register').send(valid).expect(201);
    const wrongPw = await api()
      .post('/api/auth/login')
      .send({ email: valid.email, password: 'Wrong12345' })
      .expect(401);
    const noUser = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong12345' })
      .expect(401);
    expect(wrongPw.body.error).toEqual(noUser.body.error);
    expect(wrongPw.body.error.message).toBe('Invalid email or password');
  });

  it('rate limits repeated failed attempts (brute-force protection)', async () => {
    // Own email: the limiter keys on IP + email and its counters live for the whole file.
    const target = { ...valid, email: 'brute-force-target@example.com' };
    await api().post('/api/auth/register').send(target).expect(201);
    for (let i = 0; i < env.RATE_LIMIT_LOGIN_MAX; i++) {
      await api()
        .post('/api/auth/login')
        .send({ email: target.email, password: 'Wrong12345' })
        .expect(401);
    }
    // Even the correct password is refused while the limit is active.
    const blocked = await api()
      .post('/api/auth/login')
      .send({ email: target.email, password: target.password })
      .expect(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const user = await createUser('Me Myself');
    const res = await api().get('/api/auth/me').set(user.auth).expect(200);
    expect(res.body.data).toMatchObject({ id: user.id, fullName: 'Me Myself', role: 'USER' });
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('rejects missing, malformed and forged tokens', async () => {
    await api().get('/api/auth/me').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Bearer nonsense').expect(401);
    const forged = jwt.sign({ role: 'ADMIN' }, 'a-different-secret-that-is-long-enough!!', {
      subject: 'x',
      issuer: 'projectflow-api',
      audience: 'projectflow-clients',
    });
    await api().get('/api/auth/me').set('Authorization', `Bearer ${forged}`).expect(401);
  });

  it('reports an expired token with TOKEN_EXPIRED', async () => {
    const user = await createUser();
    const expired = jwt.sign({ role: 'USER' }, env.JWT_ACCESS_SECRET, {
      subject: user.id,
      issuer: 'projectflow-api',
      audience: 'projectflow-clients',
      expiresIn: -10,
    });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${expired}`).expect(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
});

describe('refresh + logout', () => {
  it('rotates the refresh token and rejects reuse of the old one', async () => {
    const user = await createUser();
    const first = await api()
      .post('/api/auth/refresh')
      .set('X-Client-Platform', 'mobile')
      .send({ refreshToken: user.refreshToken })
      .expect(200);
    const rotated = first.body.data.refreshToken as string;
    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(user.refreshToken);

    // Replaying the old token is treated as theft: rejected, and the whole session family revoked.
    await api()
      .post('/api/auth/refresh')
      .set('X-Client-Platform', 'mobile')
      .send({ refreshToken: user.refreshToken })
      .expect(401);
    await api()
      .post('/api/auth/refresh')
      .set('X-Client-Platform', 'mobile')
      .send({ refreshToken: rotated })
      .expect(401);
  });

  it('works with the browser cookie', async () => {
    await api().post('/api/auth/register').send(valid).expect(201);
    const agent = (await import('supertest')).default.agent((await import('./helpers')).app);
    await agent.post('/api/auth/login').send({ email: valid.email, password: valid.password }).expect(200);
    const res = await agent.post('/api/auth/refresh').send({}).expect(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('logout revokes the refresh token', async () => {
    const user = await createUser();
    await api().post('/api/auth/logout').send({ refreshToken: user.refreshToken }).expect(204);
    const res = await api()
      .post('/api/auth/refresh')
      .set('X-Client-Platform', 'mobile')
      .send({ refreshToken: user.refreshToken })
      .expect(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('logout is idempotent', async () => {
    await api().post('/api/auth/logout').send({}).expect(204);
    await api().post('/api/auth/logout').send({ refreshToken: 'unknown' }).expect(204);
  });
});
