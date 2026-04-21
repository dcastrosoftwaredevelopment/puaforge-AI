import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, token: string) {
  const appUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
  const link = `${appUrl}/email-confirmed?token=${token}`;

  await transporter.sendMail({
    from: `"PuaForge AI" <${process.env.FROM_EMAIL ?? process.env.SMTP_USER}>`,
    to,
    subject: 'Confirme seu e-mail — PuaForge AI',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#fff">
          <span style="color:#4f8ef7">PuaForge</span>
          <span style="color:#c0785a"> AI</span>
        </h2>
        <p style="margin:24px 0 8px;font-size:15px">Olá! Confirme seu e-mail para ativar sua conta.</p>
        <a href="${link}"
           style="display:inline-block;margin:16px 0;padding:12px 28px;background:#c0785a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          Confirmar e-mail
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#888">
          O link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.
        </p>
        <p style="margin:4px 0 0;font-size:11px;color:#555;word-break:break-all">${link}</p>
      </div>
    `,
  });
}
