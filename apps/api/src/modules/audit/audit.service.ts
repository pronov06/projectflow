import type { Prisma } from '@prisma/client';
import { logger } from '../../config/logger';
import { prisma } from '../../lib/prisma';

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'REFRESH_TOKEN_REUSE'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED';

interface AuditEntry {
  userId: string | null;
  action: AuditAction;
  entityType?: 'USER' | 'PROJECT' | 'TASK';
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}

/**
 * Writes an audit record. Fire-and-forget: a failed audit write is logged
 * but never fails the user's request.
 */
export function audit(entry: AuditEntry): void {
  prisma.auditLog
    .create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        ip: entry.ip?.slice(0, 64),
      },
    })
    .catch((err: unknown) => logger.error({ err, action: entry.action }, 'Failed to write audit log'));
}

export async function listAuditLogs(userId: string, page: number, limit: number) {
  const where = { userId };
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}
