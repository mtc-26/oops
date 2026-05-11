import { Router } from 'express';
import { User } from '../models/user.js';
import { OtpCode } from '../models/otp.js';
import { generateOtpCode, getEmailService } from '../services/email.js';
import {
  generateTotpSecret,
  generateOtpAuthUrl,
  generateQrDataUrl,
  verifyTotp,
} from '../services/totp.js';
import {
  hashPassword,
  signSession,
  verifyPassword,
} from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const OTP_TTL_MIN = 5;
const IS_DEV = process.env.NODE_ENV !== 'production';
// Only expose OTP in response when email is NOT actually being sent (console mode).
// When Resend is configured, OTPs go to email only — never to the client.
const EXPOSE_DEV_OTP = IS_DEV && (process.env.EMAIL_PROVIDER ?? 'console') === 'console';

function expiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
}

async function issueOtp(email: string, purpose: 'register' | 'login' | 'reset_motp') {
  const code = generateOtpCode();
  await OtpCode.deleteMany({ email, purpose, used: false });
  await OtpCode.create({ email, code, purpose, expiresAt: expiresAt() });
  await getEmailService().sendOtp(email, code, purpose);
  return code;
}

async function consumeOtp(email: string, code: string, purpose: 'register' | 'login' | 'reset_motp') {
  const otp = await OtpCode.findOne({ email, purpose, used: false }).sort({ createdAt: -1 });
  if (!otp) return false;
  if (otp.code !== code) return false;
  if (otp.expiresAt < new Date()) return false;
  otp.used = true;
  await otp.save();
  return true;
}

// ─── Register ──────────────────────────────────────────────────────────
authRouter.post('/register', async (req, res) => {
  const { fullName, email, phone } = req.body ?? {};
  if (!fullName || !email) {
    return res.status(400).json({ error: 'fullName and email required' });
  }
  const normalized = String(email).toLowerCase();

  let user = await User.findOne({ email: normalized });
  if (user && user.emailVerified) {
    return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
  }
  if (!user) {
    user = await User.create({ fullName, email: normalized, phone, role: 'member' });
  } else {
    user.fullName = fullName;
    user.phone = phone;
    await user.save();
  }

  const code = await issueOtp(normalized, 'register');
  return res.json({
    ok: true,
    email: normalized,
    ...(EXPOSE_DEV_OTP ? { devOtp: code } : {}),
  });
});

// ─── Verify email-OTP after register ───────────────────────────────────
authRouter.post('/verify-email', async (req, res) => {
  const { email, code } = req.body ?? {};
  if (!email || !code) return res.status(400).json({ error: 'email + code required' });
  const normalized = String(email).toLowerCase();

  const valid = await consumeOtp(normalized, String(code), 'register');
  if (!valid) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ' });

  const user = await User.findOne({ email: normalized });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.emailVerified = true;
  if (!user.totpSecret) user.totpSecret = generateTotpSecret();
  await user.save();

  const otpauth = generateOtpAuthUrl(user.email, user.totpSecret!);
  const qr = await generateQrDataUrl(otpauth);
  return res.json({ ok: true, otpauth, qr, secret: user.totpSecret });
});

// ─── Confirm TOTP setup (first time) ───────────────────────────────────
authRouter.post('/confirm-totp', async (req, res) => {
  const { email, token } = req.body ?? {};
  if (!email || !token) return res.status(400).json({ error: 'email + token required' });
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user?.totpSecret) return res.status(404).json({ error: 'No TOTP setup' });

  if (!verifyTotp(String(token), user.totpSecret)) {
    return res.status(400).json({ error: 'รหัส M-OTP ไม่ถูกต้อง' });
  }
  user.totpVerified = true;
  await user.save();

  const jwt = await signSession({ sub: String(user._id), email: user.email, role: user.role as any });
  return res.json({
    ok: true,
    token: jwt,
    user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
  });
});

// ─── Login: request Email-OTP (first time or when TOTP not yet) ────────
authRouter.post('/login/request-email-otp', async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'email required' });
  const normalized = String(email).toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีอีเมลนี้' });
  if (user.disabled) return res.status(403).json({ error: 'บัญชีถูกระงับ' });

  const code = await issueOtp(normalized, 'login');
  return res.json({ ok: true, ...(EXPOSE_DEV_OTP ? { devOtp: code } : {}) });
});

// ─── Login member (M-OTP from Authenticator) ───────────────────────────
authRouter.post('/login/member', async (req, res) => {
  const { email, token } = req.body ?? {};
  if (!email || !token) return res.status(400).json({ error: 'email + token required' });
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีอีเมลนี้' });
  if (user.disabled) return res.status(403).json({ error: 'บัญชีถูกระงับ' });
  if (!user.totpSecret || !user.totpVerified) {
    return res.status(400).json({ error: 'ยังไม่ได้ตั้งค่า Authenticator' });
  }
  if (!verifyTotp(String(token), user.totpSecret)) {
    return res.status(400).json({ error: 'รหัส M-OTP ไม่ถูกต้อง' });
  }

  const jwt = await signSession({ sub: String(user._id), email: user.email, role: user.role as any });
  return res.json({
    ok: true,
    token: jwt,
    user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
  });
});

// ─── Login admin / superadmin (password + M-OTP) ───────────────────────
authRouter.post('/login/admin', async (req, res) => {
  const { email, password, token } = req.body ?? {};
  if (!email || !password || !token) {
    return res.status(400).json({ error: 'email + password + token required' });
  }
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีอีเมลนี้' });
  if (user.disabled) return res.status(403).json({ error: 'บัญชีถูกระงับ' });
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ error: 'ไม่ใช่บัญชี admin' });
  }
  if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }
  if (!user.totpSecret || !verifyTotp(String(token), user.totpSecret)) {
    return res.status(400).json({ error: 'รหัส M-OTP ไม่ถูกต้อง' });
  }
  const jwt = await signSession({ sub: String(user._id), email: user.email, role: user.role as any });
  return res.json({
    ok: true,
    token: jwt,
    user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
  });
});

// ─── Reset M-OTP (3-step) ──────────────────────────────────────────────
authRouter.post('/reset-motp/request', async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'email required' });
  const normalized = String(email).toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีอีเมลนี้' });
  const code = await issueOtp(normalized, 'reset_motp');
  return res.json({ ok: true, ...(EXPOSE_DEV_OTP ? { devOtp: code } : {}) });
});

authRouter.post('/reset-motp/verify', async (req, res) => {
  const { email, code } = req.body ?? {};
  if (!email || !code) return res.status(400).json({ error: 'email + code required' });
  const normalized = String(email).toLowerCase();
  const valid = await consumeOtp(normalized, String(code), 'reset_motp');
  if (!valid) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ' });
  return res.json({ ok: true });
});

authRouter.post('/reset-motp/new', async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีอีเมลนี้' });

  user.totpSecret = generateTotpSecret();
  user.totpVerified = false;
  await user.save();

  const otpauth = generateOtpAuthUrl(user.email, user.totpSecret!);
  const qr = await generateQrDataUrl(otpauth);
  return res.json({ ok: true, otpauth, qr, secret: user.totpSecret });
});

// ─── Current session info ──────────────────────────────────────────────
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session!.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    emailVerified: user.emailVerified,
    totpVerified: user.totpVerified,
    disabled: user.disabled,
  });
});

// ─── Contact admin (no auth required) ──────────────────────────────────
authRouter.post('/contact-admin', async (req, res) => {
  const { fullName, username, email, phone, address } = req.body ?? {};
  if (!fullName || !email) return res.status(400).json({ error: 'fullName + email required' });
  // In real flow: store in db / send email to admin team.
  console.log('───── 📨 Contact admin request ─────');
  console.log({ fullName, username, email, phone, address });
  console.log('────────────────────────────────────');
  return res.json({ ok: true });
});

// ─── Dev-only seeder: create admin/superadmin ──────────────────────────
if (IS_DEV) {
  authRouter.post('/_dev/seed-admin', async (req, res) => {
    const { email, password, role } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'email + password required' });
    const normalized = String(email).toLowerCase();
    const r = role === 'superadmin' ? 'superadmin' : 'admin';
    const passwordHash = await hashPassword(password);
    const totpSecret = generateTotpSecret();
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      existing.role = r;
      existing.passwordHash = passwordHash;
      existing.totpSecret = totpSecret;
      existing.totpVerified = true;
      existing.emailVerified = true;
      await existing.save();
    } else {
      await User.create({
        email: normalized,
        fullName: `${r} user`,
        role: r,
        passwordHash,
        totpSecret,
        totpVerified: true,
        emailVerified: true,
      });
    }
    const otpauth = generateOtpAuthUrl(normalized, totpSecret);
    return res.json({ ok: true, email: normalized, role: r, totpSecret, otpauth });
  });
}
