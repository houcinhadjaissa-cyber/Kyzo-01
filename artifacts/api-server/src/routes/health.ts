// artifacts/api-server/src/routes/health.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'aios-api',
    env: process.env.NODE_ENV || 'development'
  });
});

// Prevent TS "emit skipped" by ensuring a default export
export default router;
