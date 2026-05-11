import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { checkerRouter } from './routes/checker.js';
import { authRouter } from './routes/auth.js';
import { vaultRouter } from './routes/vault.js';
import { connectMongo } from './db/mongo.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:4321',
    credentials: true,
  }),
);

app.get('/', (_req, res) => {
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
  // Translate known errors to user-friendly messages
  let userMessage = err.message;
  if (/Resend send failed: 403/.test(err.message)) {
    const match = err.message.match(/your own email address \(([^)]+)\)/);
    const allowedEmail = match?.[1] ?? '(unknown)';
    userMessage = `ส่งอีเมลไม่ได้: Resend (free tier) อนุญาตให้ส่งไปแค่ ${allowedEmail} เท่านั้น — กรุณา register ด้วยอีเมลนี้`;
  } else if (/Resend send failed/.test(err.message)) {
    userMessage = 'ส่งอีเมลไม่ได้ ลองใหม่อีกครั้ง';
  }
  res.status(500).json({ error: userMessage });
});

const port = Number(process.env.PORT) || 3100;
connectMongo()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 OOPS! backend (Express) listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start: MongoDB connect error');
    console.error(err);
    process.exit(1);
  });

export default app;
