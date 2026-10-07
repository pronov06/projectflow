import { Router } from 'express';
import {
  idParamSchema,
  projectCreateSchema,
  projectListQuerySchema,
  projectUpdateSchema,
  type ProjectListQuery,
} from '@pms/shared';
import { authenticate, currentUserId } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { sendData } from '../../utils/http';
import { buildMeta } from '../../utils/pagination';
import * as projects from './projects.service';

export const projectsRouter = Router();

projectsRouter.use(authenticate);

projectsRouter.get('/', validate({ query: projectListQuerySchema }), async (req, res) => {
  const q = req.validatedQuery as ProjectListQuery;
  const { items, total } = await projects.listProjects(currentUserId(req), q);
  sendData(res, items, 200, buildMeta(q.page, q.limit, total));
});

projectsRouter.get('/:id', validate({ params: idParamSchema }), async (req, res) => {
  sendData(res, await projects.getProject(currentUserId(req), req.params.id as string));
});

projectsRouter.post('/', validate({ body: projectCreateSchema }), async (req, res) => {
  sendData(res, await projects.createProject(currentUserId(req), req.body, req.ip), 201);
});

projectsRouter.put(
  '/:id',
  validate({ params: idParamSchema, body: projectUpdateSchema }),
  async (req, res) => {
    const id = req.params.id as string;
    sendData(res, await projects.updateProject(currentUserId(req), id, req.body, req.ip));
  },
);

projectsRouter.delete('/:id', validate({ params: idParamSchema }), async (req, res) => {
  await projects.deleteProject(currentUserId(req), req.params.id as string, req.ip);
  res.status(204).end();
});
