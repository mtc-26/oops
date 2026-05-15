import { Router, type Request } from 'express';
import { User } from '../models/user.js';
import { SystemOfUsers } from '../models/systemOfUsers.js';
import { SecretVault } from '../models/secretVault.js';
import { SecretAndValue } from '../models/secretAndValue.js';
import { requireAuth } from '../middleware/auth.js';
import { encrypt, decrypt } from '../services/secret-crypto.js';

export const vaultRouter = Router();
vaultRouter.use(requireAuth);

async function getUserUid(req: Request): Promise<string | null> {
  const user = await User.findById(req.session!.sub);
  return user?.uid ?? null;
}

// ─── List vault entries with decrypted secrets ─────────────────────────
vaultRouter.get('/', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const vaults = await SecretVault.find({ uid }).sort({ createdAt: -1 });
  const entries = await Promise.all(
    vaults.map(async (v) => {
      const sys = await SystemOfUsers.findOne({ systemID: v.systemID });
      const secrets = await SecretAndValue.find({ systemID: v.systemID });
      return {
        vid: v.vid,
        systemID: v.systemID,
        systemName: sys?.systemName ?? '',
        secrets: secrets.map((s) => ({
          id: s.secretandvalueId,
          name: s.secretName,
          value: decrypt(s.value),
        })),
        createdAt: (v as any).createdAt,
      };
    }),
  );
  res.json({ entries });
});

// ─── Get single entry by vid ───────────────────────────────────────────
vaultRouter.get('/:vid', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const vault = await SecretVault.findOne({ vid: req.params.vid, uid });
  if (!vault) return res.status(404).json({ error: 'Not found' });

  const sys = await SystemOfUsers.findOne({ systemID: vault.systemID });
  const secrets = await SecretAndValue.find({ systemID: vault.systemID });

  res.json({
    vid: vault.vid,
    systemID: vault.systemID,
    systemName: sys?.systemName ?? '',
    secrets: secrets.map((s) => ({
      id: s.secretandvalueId,
      name: s.secretName,
      value: decrypt(s.value),
    })),
  });
});

// ─── Create entry ──────────────────────────────────────────────────────
vaultRouter.post('/', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const { systemName, secrets } = req.body ?? {};
  if (!systemName || !secrets || typeof secrets !== 'object') {
    return res.status(400).json({ error: 'systemName + secrets required' });
  }

  const sys = await SystemOfUsers.create({ systemName });
  const vault = await SecretVault.create({ uid, systemID: sys.systemID });

  const rows = Object.entries(secrets as Record<string, unknown>)
    .filter(([, value]) => typeof value === 'string' && value.length > 0)
    .map(([name, value]) => ({
      secretName: name,
      value: encrypt(String(value)),
      systemID: sys.systemID,
    }));
  if (rows.length > 0) {
    for (const r of rows) await SecretAndValue.create(r);
  }

  res.json({ ok: true, vid: vault.vid });
});

// ─── Update entry ──────────────────────────────────────────────────────
vaultRouter.put('/:vid', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const { systemName, secrets } = req.body ?? {};
  const vault = await SecretVault.findOne({ vid: req.params.vid, uid });
  if (!vault) return res.status(404).json({ error: 'Not found' });

  if (systemName) {
    await SystemOfUsers.updateOne({ systemID: vault.systemID }, { systemName });
  }

  if (secrets && typeof secrets === 'object') {
    await SecretAndValue.deleteMany({ systemID: vault.systemID });
    const rows = Object.entries(secrets as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
      .map(([name, value]) => ({
        secretName: name,
        value: encrypt(String(value)),
        systemID: vault.systemID,
      }));
    for (const r of rows) await SecretAndValue.create(r);
  }

  res.json({ ok: true });
});

// ─── Delete entry ──────────────────────────────────────────────────────
vaultRouter.delete('/:vid', async (req, res) => {
  const uid = await getUserUid(req);
  if (!uid) return res.status(404).json({ error: 'User not found' });

  const vault = await SecretVault.findOne({ vid: req.params.vid, uid });
  if (!vault) return res.status(404).json({ error: 'Not found' });

  await SecretAndValue.deleteMany({ systemID: vault.systemID });
  await SystemOfUsers.deleteOne({ systemID: vault.systemID });
  await SecretVault.deleteOne({ _id: vault._id });

  res.json({ ok: true });
});
