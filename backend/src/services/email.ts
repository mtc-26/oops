import nodemailer, { Transporter } from 'nodemailer';

export interface EmailService {
  sendOtp(email: string, code: string, purpose: string): Promise<void>;
}

function buildSubject(purpose: string): string {
  if (purpose === 'register') return 'OOPS! — ยืนยันการสมัครสมาชิก';
  if (purpose === 'reset_motp') return 'OOPS! — รหัสรีเซ็ต M-OTP';
  return 'OOPS! — รหัส OTP';
}

function buildHtml(code: string): string {
  return `<div style="font-family:sans-serif;padding:24px;max-width:480px;margin:auto;background:#fff">
    <h2 style="color:#F5A623;font-size:32px;letter-spacing:-1px;margin:0 0 16px">OOPS!</h2>
    <p style="color:#1a1a1a;margin:0 0 8px">รหัส OTP ของคุณคือ:</p>
    <h1 style="letter-spacing:8px;color:#0E47C2;font-size:42px;margin:0 0 16px;font-family:monospace">${code}</h1>
    <p style="color:#666;font-size:14px;margin:0">หมดอายุใน 5 นาที — ห้ามแจ้งรหัสนี้กับผู้อื่น</p>
  </div>`;
}

class ConsoleEmailService implements EmailService {
  async sendOtp(email: string, code: string, purpose: string): Promise<void> {
    console.log('───── 📧 Email OTP (console mode) ─────');
    console.log(`  to:      ${email}`);
    console.log(`  purpose: ${purpose}`);
    console.log(`  code:    ${code}  (expires in 5 min)`);
    console.log('───────────────────────────────────────');
  }
}

class ResendEmailService implements EmailService {
  constructor(private apiKey: string, private from: string) {}

  async sendOtp(email: string, code: string, purpose: string): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: email,
        subject: buildSubject(purpose),
        html: buildHtml(code),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend send failed: ${res.status} ${text}`);
    }
  }
}

class GmailEmailService implements EmailService {
  private transport: Transporter;

  constructor(private user: string, appPassword: string, private from: string) {
    this.transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
    });
  }

  async sendOtp(email: string, code: string, purpose: string): Promise<void> {
    try {
      await this.transport.sendMail({
        from: this.from,
        to: email,
        subject: buildSubject(purpose),
        html: buildHtml(code),
      });
    } catch (err: any) {
      // Common Gmail errors → friendlier message
      const msg = err?.message ?? '';
      if (/Invalid login|535/.test(msg)) {
        throw new Error('Gmail SMTP login ไม่ผ่าน — ตรวจสอบ App Password (ต้องเปิด 2FA ก่อน)');
      }
      throw new Error(`Gmail send failed: ${msg}`);
    }
  }
}

let cached: EmailService | null = null;

export function getEmailService(): EmailService {
  if (cached) return cached;
  const provider = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();

  if (provider === 'gmail') {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''); // strip spaces in app password
    const from = process.env.EMAIL_FROM ?? (user ? `OOPS! <${user}>` : '');
    if (!user || !pass) {
      console.warn('⚠️  GMAIL_USER or GMAIL_APP_PASSWORD missing — falling back to console mode');
      cached = new ConsoleEmailService();
    } else {
      console.log(`📧 Email provider: gmail (${user})`);
      cached = new GmailEmailService(user, pass, from);
    }
  } else if (provider === 'resend') {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? 'OOPS! <onboarding@resend.dev>';
    if (!key) {
      console.warn('⚠️  RESEND_API_KEY missing — falling back to console mode');
      cached = new ConsoleEmailService();
    } else {
      console.log(`📧 Email provider: resend`);
      cached = new ResendEmailService(key, from);
    }
  } else {
    console.log('📧 Email provider: console (no real email sent)');
    cached = new ConsoleEmailService();
  }
  return cached;
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
