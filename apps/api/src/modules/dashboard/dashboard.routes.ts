import { Router } from 'express';
import { authenticate, currentUserId } from '../../middleware/authenticate';
import { sendData } from '../../utils/http';
import { getDashboard } from './dashboard.service';

export const dashboardRouter = Router();

dashboardRouter.get('/', authenticate, async (req, res) => {
  sendData(res, await getDashboard(currentUserId(req)));
});
