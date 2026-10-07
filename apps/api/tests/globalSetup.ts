import { execSync } from 'node:child_process';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Brings the test database schema up to date once before the suite (non-destructive).
 * Each test file then empties the tables itself (see `resetDb` in helpers.ts).
 */
export default function setup() {
  process.env.NODE_ENV = 'test';
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), quiet: true });
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Refusing to run tests against a database whose URL does not contain "test"');
  }
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
}
