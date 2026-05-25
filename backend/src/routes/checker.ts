import { Router } from 'express';
import { calculateEntropy } from '../services/entropy.js';
import { dictionaryCheck } from '../services/dictionary.js';
import { gpuAttack, SUPPORTED_GPUS } from '../services/gpu-attack.js';

export const checkerRouter = Router();

checkerRouter.post('/entropy', (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'password (string) required' });
  }
  res.json(calculateEntropy(password));
});

checkerRouter.post('/dictionary', async (req, res) => {
  const { password, dicts } = req.body ?? {};
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'password (string) required' });
  }
  const result = await dictionaryCheck(password, Array.isArray(dicts) ? dicts : undefined);
  res.json(result);
});

checkerRouter.post('/gpu-attack', (req, res) => {
  const { password, gpu } = req.body ?? {};
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'password (string) required' });
  }
  res.json(gpuAttack(password, typeof gpu === 'string' ? gpu : 'NVIDIA RTX5090'));
});

checkerRouter.get('/gpus', (_req, res) => {
  res.json({ gpus: SUPPORTED_GPUS });
});
