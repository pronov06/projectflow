import { Router } from 'express';
import {
  idParamSchema,
  taskCreateSchema,
  taskListQuerySchema,
  taskUpdateSchema,
  type TaskListQuery,
} from '@pms/shared';
import { authenticate, currentUserId } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { sendData } from '../../utils/http';
import { buildMeta } from '../../utils/pagination';
import * as tasks from './tasks.service';

export const tasksRouter = Router();

tasksRouter.use(authenticate);

tasksRouter.get('/', validate({ query: taskListQuerySchema }), async (req, res) => {
  const q = req.validatedQuery as TaskListQuery;
  const { items, total } = await tasks.listTasks(currentUserId(req), q);
  sendData(res, items, 200, buildMeta(q.page, q.limit, total));
});

tasksRouter.get('/:id', validate({ params: idParamSchema }), async (req, res) => {
  sendData(res, await tasks.getTask(currentUserId(req), req.params.id as string));
});

tasksRouter.post('/', validate({ body: taskCreateSchema }), async (req, res) => {
  sendData(res, await tasks.createTask(currentUserId(req), req.body, req.ip), 201);
});

tasksRouter.put('/:id', validate({ params: idParamSchema, body: taskUpdateSchema }), async (req, res) => {
  const id = req.params.id as string;
  sendData(res, await tasks.updateTask(currentUserId(req), id, req.body, req.ip));
});

tasksRouter.delete('/:id', validate({ params: idParamSchema }), async (req, res) => {
  await tasks.deleteTask(currentUserId(req), req.params.id as string, req.ip);
  res.status(204).end();
});
