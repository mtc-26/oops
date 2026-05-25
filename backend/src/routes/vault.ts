import { Router, type Request } from 'express';
import { User } from '../models/user.js';
import { Usersecret } from '../models/usersecret.js';
import { requireAuth } from '../middleware/auth.js';
import { encrypt, decrypt } from '../services/secret-crypto.js';

export const vaultRouter = Router();
vaultRouter.use(requireAuth);

async function getUserUid(req: Request): Promise<string | null> {
  const user = await User.findById(req.session!.sub);
  return user?.uid ?? null;
}

interface SecretsInput {
  username?: string;
  password?: string;
  pin?: string;
  qr?: string;
  other?: string;
}

function packSecrets(secrets: SecretsInput): string {
  const cleaned: SecretsInput = {};
  for (const [k, v] of Object.entries(secrets)) {
    if (typeof v === 'string' && v.length > 0) (cleaned as any)[k] = v;
  }
  return encrypt(JSON.stringify(cleaned));
}

function unpackSecrets(value: string): SecretsInput {
  try {
    return JSON.parse(decrypt(value));
  } catch {
    return {};
  }
}

function toResponse(doc: any) {
  return {
    usersecretId: doc.usersecretId,
    systemName: doc.systemName,
    secretName: doc.secretName,
    secretDescription: doc.secretDescription ?? '',
    picture: doc.picture ?? '',
    category: doc.category ?? 'อื่นๆ',
    secrets: unpackSecrets(doc.secretValue),
    createdAt: doc.createdAt,
  };
}

vaultRouter.get('/', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;
  const filter: Record<string, unknown> = { uid };
  if (category && category !== 'all') filter['category'] = category;
  const list = await Usersecret.find(filter).sort({ createdAt: -1 });
  res.json({ entries: list.map(toResponse) });
});

vaultRouter.get('/:id', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const doc = await Usersecret.findOne({ usersecretId: req.params.id, uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(toResponse(doc));
});

vaultRouter.post('/', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const { systemName, secretName, secretDescription, picture, category, secrets } = req.body ?? {};
  if (typeof systemName !== 'string' || !systemName.trim()) {
    return res.status(400).json({ error: 'systemName required' });
  }
  if (!secrets || typeof secrets !== 'object') {
    return res.status(400).json({ error: 'secrets required' });
  }
  if (typeof picture === 'string' && picture.length > 2_000_000) {
    return res.status(413).json({ error: 'รูปใหญ่เกินไป (เกิน 2MB)' });
  }

  const doc = await Usersecret.create({
    uid,
    systemName: systemName.trim(),
    secretName: typeof secretName === 'string' && secretName.trim() ? secretName.trim() : systemName.trim(),
    secretDescription: typeof secretDescription === 'string' ? secretDescription : '',
    picture: typeof picture === 'string' ? picture : '',
    category: typeof category === 'string' && category.trim() ? category.trim() : 'อื่นๆ',
    secretValue: packSecrets(secrets),
  });

  res.json({ ok: true, usersecretId: doc.usersecretId });
});

vaultRouter.put('/:id', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const { systemName, secretName, secretDescription, picture, category, secrets } = req.body ?? {};
  const doc = await Usersecret.findOne({ usersecretId: req.params.id, uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });

  if (typeof systemName === 'string' && systemName.trim()) doc.systemName = systemName.trim();
  if (typeof secretName === 'string' && secretName.trim()) doc.secretName = secretName.trim();
  if (typeof secretDescription === 'string') doc.secretDescription = secretDescription;
  if (typeof category === 'string' && category.trim()) doc.category = category.trim();
  if (typeof picture === 'string') {
    if (picture.length > 2_000_000) {
      return res.status(413).json({ error: 'รูปใหญ่เกินไป (เกิน 2MB)' });
    }
    doc.picture = picture;
  }
  if (secrets && typeof secrets === 'object') {
    doc.secretValue = packSecrets(secrets);
  }
  await doc.save();

  res.json({ ok: true });
});

vaultRouter.delete('/:id', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const doc = await Usersecret.findOneAndDelete({ usersecretId: req.params.id, uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});
