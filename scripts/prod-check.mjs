#!/usr/bin/env node
/**
 * Production smoke test + demo-data seeding — talks to a deployed API over HTTPS only.
 *
 *   node scripts/prod-check.mjs https://projectflow-api.vercel.app [--seed]
 *
 * Checks: health, register/login, auth required, validation, CRUD, cross-user isolation (404),
 * dashboard counts, logout/refresh revocation, security headers, CORS and login rate limiting.
 * With --seed it also (re)creates the demo accounts alice@example.com / bob@example.com
 * (password Password123!) with sample projects and tasks. Test data only.
 */
const base = (process.argv[2] ?? '').replace(/\/$/, '');
const seed = process.argv.includes('--seed');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/prod-check.mjs <api-origin> [--seed]');
  process.exit(1);
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

async function call(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'mobile',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, json, headers: res.headers };
}

/** Register, or log in if the account already exists. Returns tokens. */
async function account(fullName, email, password) {
  const reg = await call('POST', '/auth/register', { body: { fullName, email, password } });
  if (reg.status === 201) return reg.json.data;
  const login = await call('POST', '/auth/login', { body: { email, password } });
  if (login.status !== 200) throw new Error(`Cannot sign in ${email}: ${login.status} ${JSON.stringify(login.json)}`);
  return login.json.data;
}

const day = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

async function seedUser(fullName, email, projects) {
  const session = await account(fullName, email, 'Password123!');
  const token = session.accessToken;
  // Idempotent: remove this user's existing projects (their tasks cascade) and recreate.
  const existing = await call('GET', '/projects?limit=100', { token });
  for (const p of existing.json?.data ?? []) await call('DELETE', `/projects/${p.id}`, { token });
  for (const p of projects) {
    const created = await call('POST', '/projects', {
      token,
      body: { name: p.name, description: p.description, status: p.status, startDate: day(p.start), endDate: day(p.end) },
    });
    for (const t of p.tasks) {
      await call('POST', '/tasks', {
        token,
        body: { projectId: created.json.data.id, name: t.name, priority: t.priority, status: t.status, dueDate: day(t.due) },
      });
    }
  }
  console.log(`Seeded ${email} with ${projects.length} project(s)`);
}

async function seedDemo() {
  await seedUser('Alice Tester', 'alice@example.com', [
    {
      name: 'Website Redesign',
      description: 'Refresh the marketing site with the new brand guidelines.',
      status: 'IN_PROGRESS',
      start: -14,
      end: 30,
      tasks: [
        { name: 'Audit current pages', priority: 'MEDIUM', status: 'COMPLETED', due: -7 },
        { name: 'Design new homepage', priority: 'HIGH', status: 'IN_PROGRESS', due: 3 },
        { name: 'Write copy for pricing page', priority: 'MEDIUM', status: 'PENDING', due: 10 },
        { name: 'Set up analytics', priority: 'LOW', status: 'PENDING', due: -2 },
      ],
    },
    {
      name: 'Mobile App Launch',
      description: 'Ship v1 of the companion app to the Play Store.',
      status: 'NOT_STARTED',
      start: 7,
      end: 60,
      tasks: [
        { name: 'Prepare store listing', priority: 'MEDIUM', status: 'PENDING', due: 20 },
        { name: 'Beta test with 10 users', priority: 'HIGH', status: 'PENDING', due: 35 },
      ],
    },
    {
      name: 'Q3 Reporting',
      description: 'Quarterly metrics report for the leadership team.',
      status: 'COMPLETED',
      start: -60,
      end: -10,
      tasks: [
        { name: 'Collect metrics', priority: 'HIGH', status: 'COMPLETED', due: -20 },
        { name: 'Build slides', priority: 'MEDIUM', status: 'COMPLETED', due: -12 },
      ],
    },
  ]);
  await seedUser('Bob Tester', 'bob@example.com', [
    {
      name: 'Office Move',
      description: "Bob's private project — Alice must never see this.",
      status: 'IN_PROGRESS',
      start: -5,
      end: 15,
      tasks: [
        { name: 'Book movers', priority: 'HIGH', status: 'PENDING', due: 2 },
        { name: 'Label boxes', priority: 'LOW', status: 'IN_PROGRESS', due: 5 },
      ],
    },
  ]);
}

async function smoke() {
  const health = await call('GET', '/health');
  check('health: API and database up', health.status === 200 && health.json?.db === 'ok', JSON.stringify(health.json));
  check('security headers (helmet)', health.headers.get('x-content-type-options') === 'nosniff');
  check('no x-powered-by', !health.headers.get('x-powered-by'));

  const evil = await fetch(`${base}/api/health`, { headers: { Origin: 'https://evil.example.com' } });
  check('CORS refuses unknown origins', !evil.headers.get('access-control-allow-origin'));

  const stamp = Date.now();
  const a = await account('Smoke A', `smoke-a-${stamp}@example.com`, 'Password123');
  const b = await account('Smoke B', `smoke-b-${stamp}@example.com`, 'Password123');
  check('register returns tokens, never the password', !!a.accessToken && !JSON.stringify(a).includes('Password123'));

  check('protected route needs a token', (await call('GET', '/projects')).status === 401);
  const bad = await call('POST', '/projects', { token: a.accessToken, body: { name: '', status: 'DONE' } });
  check('validation errors return 400 with details', bad.status === 400 && bad.json?.error?.details?.length >= 2);

  const proj = await call('POST', '/projects', {
    token: a.accessToken,
    body: { name: 'Smoke project', status: 'IN_PROGRESS', startDate: day(0), endDate: day(7) },
  });
  check('create project', proj.status === 201);
  const projectId = proj.json?.data?.id;
  const task = await call('POST', '/tasks', { token: a.accessToken, body: { projectId, name: 'Smoke task', priority: 'HIGH' } });
  check('create task', task.status === 201);
  const taskId = task.json?.data?.id;
  const done = await call('PUT', `/tasks/${taskId}`, { token: a.accessToken, body: { status: 'COMPLETED' } });
  check('mark task completed', done.status === 200 && !!done.json?.data?.completedAt);

  check("other user gets 404 on A's project", (await call('GET', `/projects/${projectId}`, { token: b.accessToken })).status === 404);
  check("other user cannot delete A's task", (await call('DELETE', `/tasks/${taskId}`, { token: b.accessToken })).status === 404);
  check(
    "other user cannot add tasks to A's project",
    (await call('POST', '/tasks', { token: b.accessToken, body: { projectId, name: 'x' } })).status === 404,
  );

  const dash = await call('GET', '/dashboard', { token: a.accessToken });
  check(
    'dashboard counts are per user',
    dash.json?.data?.totalProjects === 1 && dash.json?.data?.completedTasks === 1 && dash.json?.data?.projectsInProgress === 1,
  );
  const search = await call('GET', `/tasks?search=${encodeURIComponent("' OR 1=1 --")}`, { token: a.accessToken });
  check('SQL-injection search is harmless', search.status === 200 && search.json?.data?.length === 0);

  await call('POST', '/auth/logout', { body: { refreshToken: a.refreshToken } });
  check('logout revokes the refresh token', (await call('POST', '/auth/refresh', { body: { refreshToken: a.refreshToken } })).status === 401);

  await call('DELETE', `/projects/${projectId}`, { token: a.accessToken });

  const target = `smoke-rl-${stamp}@example.com`;
  let lastStatus = 0;
  for (let i = 0; i < 7; i++) lastStatus = (await call('POST', '/auth/login', { body: { email: target, password: 'Wrong12345' } })).status;
  check('login brute force is rate limited (429)', lastStatus === 429, `last status ${lastStatus}`);
}

try {
  if (seed) await seedDemo();
  await smoke();
} catch (err) {
  check('script completed', false, err.message);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
