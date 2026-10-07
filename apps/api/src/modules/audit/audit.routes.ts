import { Router } from 'express';
import { z } from 'zod';
import { authenticate, currentUserId } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { buildMeta } from '../../utils/pagination';
import { sendData } from '../../utils/http';
import { listAuditLogs } from './audit.service';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditRouter = Router();

/** The current user's own activity history. */
auditRouter.get('/', authenticate, validate({ query: querySchema }), async (req, res) => {
  const { page, limit } = req.validatedQuery as z.output<typeof querySchema>;
  const { items, total } = await listAuditLogs(currentUserId(req), page, limit);
  sendData(res, items, 200, buildMeta(page, limit, total));
});
