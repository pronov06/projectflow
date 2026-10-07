import { describe, expect, it } from 'vitest';
import {
  isValidDateOnly,
  projectCreateSchema,
  projectUpdateSchema,
  registerSchema,
  taskCreateSchema,
  taskListQuerySchema,
} from './index';

describe('isValidDateOnly', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(isValidDateOnly('2026-02-28')).toBe(true);
    expect(isValidDateOnly('2026-02-30')).toBe(false);
    expect(isValidDateOnly('2026-13-01')).toBe(false);
    expect(isValidDateOnly('07-10-2026')).toBe(false);
  });
});

describe('registerSchema', () => {
  it('normalises email and trims name', () => {
    const out = registerSchema.parse({
      fullName: '  Alice Doe ',
      email: ' Alice@Example.COM ',
      password: 'Password1',
    });
    expect(out).toEqual({ fullName: 'Alice Doe', email: 'alice@example.com', password: 'Password1' });
  });

  it('rejects invalid email, weak password and blank name', () => {
    const r = registerSchema.safeParse({ fullName: '   ', email: 'nope', password: 'short' });
    expect(r.success).toBe(false);
    const fields = r.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });
});

describe('projectCreateSchema', () => {
  it('defaults status and converts empty strings to null', () => {
    const out = projectCreateSchema.parse({ name: 'Website', description: '', startDate: '' });
    expect(out.status).toBe('NOT_STARTED');
    expect(out.description).toBeNull();
    expect(out.startDate).toBeNull();
  });

  it('rejects end date before start date', () => {
    const r = projectCreateSchema.safeParse({
      name: 'X',
      startDate: '2026-05-10',
      endDate: '2026-05-01',
    });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path).toEqual(['endDate']);
  });

  it('rejects invalid enum values and invalid dates', () => {
    expect(projectCreateSchema.safeParse({ name: 'X', status: 'DONE' }).success).toBe(false);
    expect(projectCreateSchema.safeParse({ name: 'X', startDate: '2026-02-30' }).success).toBe(
      false,
    );
  });
});

describe('projectUpdateSchema', () => {
  it('requires at least one field', () => {
    expect(projectUpdateSchema.safeParse({}).success).toBe(false);
    expect(projectUpdateSchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
  });
});

describe('taskCreateSchema', () => {
  it('requires a valid projectId and applies defaults', () => {
    expect(taskCreateSchema.safeParse({ projectId: '123', name: 'T' }).success).toBe(false);
    const out = taskCreateSchema.parse({
      projectId: '2b1c3a4e-5f60-4a7b-8c9d-0e1f2a3b4c5d',
      name: 'T',
    });
    expect(out).toMatchObject({ priority: 'MEDIUM', status: 'PENDING' });
  });
});

describe('taskListQuerySchema', () => {
  it('coerces pagination and applies defaults', () => {
    const out = taskListQuerySchema.parse({ page: '2', limit: '5', search: '' });
    expect(out).toMatchObject({ page: 2, limit: 5, order: 'desc', sortBy: 'createdAt' });
    expect(out.search).toBeUndefined();
  });

  it('rejects unknown sort fields and oversized limits', () => {
    expect(taskListQuerySchema.safeParse({ sortBy: 'password' }).success).toBe(false);
    expect(taskListQuerySchema.safeParse({ limit: '1000' }).success).toBe(false);
  });
});
