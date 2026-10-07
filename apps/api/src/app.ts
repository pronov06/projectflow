import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { openApiSpec } from './docs/openapi';
import { swaggerCsp, swaggerHtml, swaggerInitJs } from './docs/swaggerPage';
import { prisma } from './lib/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiters';
import { auditRouter } from './modules/audit/audit.routes';
import { authRouter } from './modules/auth/auth.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind the hosting proxy (Vercel/Render) this makes req.ip the real client IP (rate limiting depends on it).
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming.length <= 64 ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      // Only the configured web origins may call the API from a browser. Requests without an
      // Origin header (the mobile app, curl) are not subject to CORS.
      origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform', 'X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/', (_req, res) => {
    res.json({ name: 'ProjectFlow API', docs: '/api/docs', health: '/api/health' });
  });

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'ok', uptime: Math.round(process.uptime()) });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'unreachable' });
    }
  });

  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.get('/api/docs/init.js', (_req, res) => {
    res.type('application/javascript').send(swaggerInitJs);
  });
  app.get(['/api/docs', '/api/docs/'], swaggerCsp, (_req, res) => {
    res.type('html').send(swaggerHtml);
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/audit-logs', auditRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
