import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { checkerRouter } from './routes/checker.js';
import { authRouter } from './routes/auth.js';
import { vaultRouter } from './routes/vault.js';
import { connectMongo } from './db/mongo.js';
import { seedDictionariesIfEmpty } from './services/seed-dictionaries.js';

export function createApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json({ limit: '5mb' }));
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
      credentials: true,
    }),
  );

  app.use(async (_req, _res, next) => {
    try {
      await connectMongo();
      await seedDictionariesIfEmpty();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.get('/', (_req, res) => {
    res.json({ name: 'OOPS! API', status: 'ok' });
  });
  app.get('/api', (_req, res) => {
    res.json({ name: 'OOPS! API', status: 'ok' });
  });
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/checker', checkerRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/vault', vaultRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    let userMessage = err.message;
    if (/Resend send failed: 403/.test(err.message)) {
      const match = err.message.match(/your own email address \(([^)]+)\)/);
      const allowedEmail = match?.[1] ?? '(unknown)';
      userMessage = `ส่งอีเมลไม่ได้: Resend (free tier) อนุญาตให้ส่งไปแค่ ${allowedEmail} เท่านั้น — กรุณา register ด้วยอีเมลนี้`;
    } else if (/Resend send failed/.test(err.message)) {
      userMessage = 'ส่งอีเมลไม่ได้ ลองใหม่อีกครั้ง';
    } else if (/Gmail SMTP login ไม่ผ่าน/.test(err.message)) {
      userMessage = err.message;
    }
    res.status(500).json({ error: userMessage });
  });

  return app;
}

export default createApp();
