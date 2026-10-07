/**
 * Starts a throwaway local PostgreSQL server (no Docker or system install needed) using the
 * `embedded-postgres` package. Data lives in apps/api/.local-pg (gitignored).
 *
 *   npm run db:local -w @pms/api
 *
 * Creates the databases `projectflow` (development) and `projectflow_test` (tests) on
 * port 5433 with user/password postgres/postgres. Press Ctrl+C to stop.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', '.local-pg');
const port = Number(process.env.LOCAL_PG_PORT ?? 5433);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port,
  persistent: true,
  onLog: () => {},
});

const fresh = !existsSync(path.join(dataDir, 'PG_VERSION'));
if (fresh) await pg.initialise();
await pg.start();

for (const db of ['projectflow', 'projectflow_test']) {
  try {
    await pg.createDatabase(db);
  } catch {
    // already exists
  }
}

console.log(`Local PostgreSQL running on postgresql://postgres:postgres@localhost:${port}`);
console.log('Databases: projectflow, projectflow_test. Press Ctrl+C to stop.');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
