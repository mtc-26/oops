import { Router, type Request, type Response, type NextFunction } from 'express';
import { User } from '../models/user.js';
import { Usersecret } from '../models/usersecret.js';
import { OtpCode } from '../models/otp.js';
import { Gpu } from '../models/gpu.js';
import { Dictionary } from '../models/dictionary.js';
import { requireAuth } from '../middleware/auth.js';
import { generateTotpSecret } from '../services/totp.js';
import { hashPassword } from '../services/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.session?.role;
  if (role !== 'Admin' && role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'SuperAdmin only' });
  }
  next();
}

adminRouter.use(requireAdmin);

// ─── Users ────────────────────────────────────────────────────────────
adminRouter.get('/users', async (_req, res) => {
  const users = await User.find().sort({ role: 1, createdAt: -1 });
  res.json({
    users: users.map((u) => ({
      id: u._id,
      uid: u.uid,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone ?? '',
      role: u.role,
      disable: u.disable,
      motpReady: u.motpReady,
      createdAt: (u as any).createdAt,
    })),
  });
});

adminRouter.put('/users/:uid/disable', async (req, res) => {
  const user = await User.findOne({ uid: req.params.uid });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'SuperAdmin') {
    return res.status(403).json({ error: 'SuperAdmin disable ไม่ได้' });
  }
  const { disable } = req.body ?? {};
  user.disable = !!disable;
  await user.save();
  res.json({ ok: true, disable: user.disable });
});

adminRouter.delete('/users/:uid', async (req, res) => {
  const user = await User.findOne({ uid: req.params.uid });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'SuperAdmin') {
    return res.status(403).json({ error: 'SuperAdmin ลบไม่ได้' });
  }
  // Admin can only manage Members; only SuperAdmin can delete an Admin
  if (user.role === 'Admin' && req.session?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Admin ลบ Admin ไม่ได้' });
  }
  await Usersecret.deleteMany({ uid: user.uid });
  await OtpCode.deleteMany({ email: user.email });
  await User.deleteOne({ _id: user._id });
  res.json({ ok: true });
});

// SuperAdmin only: create new Admin with initial password (admin must complete first-login)
adminRouter.post('/users/admin', requireSuperAdmin, async (req, res) => {
  const { email, fullName, password } = req.body ?? {};
  if (!email || !fullName || !password) {
    return res.status(400).json({ error: 'email + fullName + password required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องยาว ≥ 6 ตัว' });
  }
  const normalized = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalized });
  if (existing) return res.status(409).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
  const user = await User.create({
    email: normalized,
    fullName: String(fullName).trim(),
    password: await hashPassword(password),
    otpSecret: generateTotpSecret(),
    role: 'Admin',
    motpReady: false,
  });
  res.json({
    ok: true,
    user: { id: user._id, uid: user.uid, email: user.email, fullName: user.fullName, role: user.role },
  });
});

// ─── GPUs ─────────────────────────────────────────────────────────────
adminRouter.post('/gpus', async (req, res) => {
  const { gpuName, brand, scryptHashrate, memory } = req.body ?? {};
  if (!gpuName || !brand || !scryptHashrate || !memory) {
    return res.status(400).json({ error: 'gpuName + brand + scryptHashrate + memory required' });
  }
  const existing = await Gpu.findOne({ gpuName });
  if (existing) return res.status(409).json({ error: 'GPU นี้มีอยู่แล้ว' });
  const gpu = await Gpu.create({
    gpuName: String(gpuName).trim(),
    brand: String(brand).trim(),
    scryptHashrate: Number(scryptHashrate),
    memory: Number(memory),
  });
  res.json({ ok: true, gpu });
});

adminRouter.put('/gpus/:gid', async (req, res) => {
  const gpu = await Gpu.findOne({ gid: Number(req.params.gid) });
  if (!gpu) return res.status(404).json({ error: 'GPU not found' });
  const { gpuName, brand, scryptHashrate, memory } = req.body ?? {};
  if (typeof gpuName === 'string' && gpuName.trim()) gpu.gpuName = gpuName.trim();
  if (typeof brand === 'string' && brand.trim()) gpu.brand = brand.trim();
  if (scryptHashrate != null) gpu.scryptHashrate = Number(scryptHashrate);
  if (memory != null) gpu.memory = Number(memory);
  await gpu.save();
  res.json({ ok: true, gpu });
});

adminRouter.delete('/gpus/:gid', async (req, res) => {
  const r = await Gpu.deleteOne({ gid: Number(req.params.gid) });
  if (r.deletedCount === 0) return res.status(404).json({ error: 'GPU not found' });
  res.json({ ok: true });
});

// ─── Dictionaries ─────────────────────────────────────────────────────
adminRouter.get('/dictionaries', async (_req, res) => {
  const dicts = await Dictionary.find().sort({ dictname: 1 });
  res.json({
    dictionaries: dicts.map((d) => ({ did: d.did, dictname: d.dictname, dictfile: d.dictfile })),
  });
});

adminRouter.put('/dictionaries/:did', async (req, res) => {
  const dict = await Dictionary.findOne({ did: req.params.did });
  if (!dict) return res.status(404).json({ error: 'Dictionary not found' });
  const { dictname, dictfile } = req.body ?? {};
  if (typeof dictname === 'string' && dictname.trim()) dict.dictname = dictname.trim();
  if (typeof dictfile === 'string' && dictfile.trim()) dict.dictfile = dictfile.trim();
  await dict.save();
  res.json({ ok: true, dictionary: { did: dict.did, dictname: dict.dictname, dictfile: dict.dictfile } });
});

adminRouter.delete('/dictionaries/:did', async (req, res) => {
  const r = await Dictionary.deleteOne({ did: req.params.did });
  if (r.deletedCount === 0) return res.status(404).json({ error: 'Dictionary not found' });
  res.json({ ok: true });
});
