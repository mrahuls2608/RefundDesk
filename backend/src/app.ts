import cors from 'cors';
import express, { type Express, Router } from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { corsOrigins } from './config/env.js';
import { errorHandler, notFoundHandler } from './common/errorHandler.js';
import { logger } from './common/logger.js';
import { currentTraceId } from './common/requestContext.js';
import { traceIdMiddleware } from './common/traceId.js';
import { getRedis } from './infra/redis.js';
import { registry } from './metrics/metrics.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { meRouter, publicAuthRouter } from './modules/auth/auth.routes.js';
import { createCaseRouter } from './modules/casemgmt/case.routes.js';
import type { CaseService } from './modules/casemgmt/case.service.js';
import { createTransactionRouter } from './modules/transaction/transaction.routes.js';
import { createTransactionService } from './modules/transaction/transaction.service.js';
import { Role } from './modules/user/role.js';
import { authenticate, requireRole } from './security/authenticate.js';

const JSON_BODY_LIMIT = '32kb';

export interface AppDeps {
  caseService: CaseService;
}

export function createApp({ caseService }: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(traceIdMiddleware);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, exposedHeaders: ['X-Trace-Id'], maxAge: 600 }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(
    pinoHttp({
      logger,
      genReqId: () => currentTraceId(),
      customProps: () => ({ traceId: currentTraceId() }),
      serializers: { req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }) },
      autoLogging: { ignore: (req) => req.url === '/actuator/health' },
    }),
  );

  app.get('/actuator/health', healthHandler);
  app.use(publicAuthRouter);

  // Everything below requires a valid JWT (default deny).
  const secured = Router();
  secured.use(authenticate);
  secured.use(meRouter);
  secured.use(createTransactionRouter(createTransactionService((ids) => caseService.openCasesFor(ids))));
  secured.use(createCaseRouter(caseService));
  secured.use(adminRouter);
  secured.get('/actuator/prometheus', requireRole(Role.ADMIN), async (_req, res) => {
    res.type(registry.contentType).send(await registry.metrics());
  });
  app.use(secured);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const healthHandler: express.RequestHandler = async (_req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const redis = await getRedis()
    .ping()
    .then(() => 'UP')
    .catch(() => 'DOWN');
  const status = db === 'UP' ? 'UP' : 'DOWN';
  res.status(status === 'UP' ? 200 : 503).json({ status, components: { db, redis } });
};
