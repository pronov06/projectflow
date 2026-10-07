import { Router } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@pms/shared';
import { authenticate } from '../../middleware/authenticate';
import { loginLimiter, refreshLimiter, registerLimiter } from '../../middleware/rateLimiters';
import { validate } from '../../middleware/validate';
import * as auth from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate({ body: registerSchema }), auth.register);
authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), auth.login);
authRouter.post('/refresh', refreshLimiter, validate({ body: refreshSchema }), auth.refresh);
// Logout only needs the refresh token, so it still works after the access token has expired.
authRouter.post('/logout', validate({ body: refreshSchema }), auth.logout);
authRouter.get('/me', authenticate, auth.me);
