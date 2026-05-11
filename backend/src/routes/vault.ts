import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { User } from '../models/user.js';
import { Vault, VAULT_CATEGORIES, type VaultCategory } from '../models/vault.js';
import { requireAuth } from '../middleware/auth.js';

export const vaultRouter = Router();

vaultRouter.use(requireAuth);

// ─── Passphrase: get state (has the user set one?) ─────────────────────
vaultRouter.get('/passphrase', async (req, res) => {
  const user = await User.findById(req.session!.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    set: !!user.passphraseVerifier,
    salt: user.passphraseSalt ?? null,
    verifier: user.passphraseVerifier ?? null,
    verifierIv: user.passphraseVerifierIv ?? null,
  });
});

// ─── Passphrase: set up (first time only) ──────────────────────────────
// Client derives key, encrypts the known verifier plaintext, sends:
//   { salt (b64), verifier (b64), verifierIv (b64) }
// Server stores opaquely. Server NEVER sees the key.
vaultRouter.post('/passphrase/setup', async (req, res) => {
  const { salt, verifier, verifierIv } = req.body ?? {};
  if (!salt || !verifier || !verifierIv) {
    return res.status(400).json({ error: 'salt + verifier + verifierIv required' });
  }
  const user = await User.findById(req.session!.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.passphraseVerifier) {
    return res.status(409).json({ error: 'passphrase already set' });
  }
  user.passphraseSalt = salt;
  user.passphraseVerifier = verifier;
  user.passphraseVerifierIv = verifierIv;
  await user.save();
  res.json({ ok: true });
});

// ─── Generate a fresh salt (for client-side key derivation init) ───────
vaultRouter.get('/passphrase/new-salt', (_req, res) => {
  res.json({ salt: randomBytes(16).toString('base64') });
});

// ─── List vault entries (encrypted blobs only) ─────────────────────────
vaultRouter.get('/', async (req, res) => {
  const cat = req.query['category'] as string | undefined;
  const filter: any = { userId: req.session!.sub };
  if (cat && (VAULT_CATEGORIES as readonly string[]).includes(cat)) {
    filter.category = cat;
  }
  const entries = await Vault.find(filter).sort({ createdAt: -1 });
  res.json({
    entries: entries.map((e) => ({
      id: e._id,
      systemName: e.systemName,
      category: e.category,
      color: e.color,
      ciphertext: e.ciphertext,
      iv: e.iv,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
  });
});

// ─── Get single entry ──────────────────────────────────────────────────
vaultRouter.get('/:id', async (req, res) => {
  const entry = await Vault.findOne({ _id: req.params.id, userId: req.session!.sub });
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: entry._id,
    systemName: entry.systemName,
    category: entry.category,
    color: entry.color,
    ciphertext: entry.ciphertext,
    iv: entry.iv,
  });
});

// ─── Create entry ──────────────────────────────────────────────────────
vaultRouter.post('/', async (req, res) => {
  const { systemName, category, color, ciphertext, iv } = req.body ?? {};
  if (!systemName || !ciphertext || !iv) {
    return res.status(400).json({ error: 'systemName, ciphertext, iv required' });
  }
  const cat = (VAULT_CATEGORIES as readonly string[]).includes(category)
    ? (category as VaultCategory)
    : 'other';
  const entry = await Vault.create({
    userId: req.session!.sub,
    systemName,
    category: cat,
    color: color ?? '#7a8597',
    ciphertext,
    iv,
  });
  res.json({ id: entry._id, ok: true });
});

// ─── Update entry ──────────────────────────────────────────────────────
vaultRouter.put('/:id', async (req, res) => {
  const { systemName, category, color, ciphertext, iv } = req.body ?? {};
  const entry = await Vault.findOne({ _id: req.params.id, userId: req.session!.sub });
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (systemName) entry.systemName = systemName;
  if (category && (VAULT_CATEGORIES as readonly string[]).includes(category)) {
    entry.category = category;
  }
  if (color) entry.color = color;
  if (ciphertext && iv) {
    entry.ciphertext = ciphertext;
    entry.iv = iv;
  }
  await entry.save();
  res.json({ ok: true });
});

// ─── Delete entry ──────────────────────────────────────────────────────
vaultRouter.delete('/:id', async (req, res) => {
  const result = await Vault.deleteOne({ _id: req.params.id, userId: req.session!.sub });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});
