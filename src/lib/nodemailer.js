import nodemailer from 'nodemailer';
import crypto from 'crypto';

let cachedTransporter = null;
let cachedCredentialsKey = null;

/**
 * Cria ou retorna o transporter do Nodemailer com pool de conexões e sanitização de credenciais.
 * Remove espaços de senhas de aplicativo do Google geradas em blocos.
 */
export function getEmailTransporter() {
  const user = (process.env.EMAIL_USER || '').trim();
  const rawPass = process.env.EMAIL_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');
  const credentialsKey = `${user}:${pass}`;

  if (cachedTransporter && cachedCredentialsKey === credentialsKey) {
    return cachedTransporter;
  }

  cachedCredentialsKey = credentialsKey;
  cachedTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    rateDelta: 1000,
    rateLimit: 3,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass,
    },
  });

  return cachedTransporter;
}

/**
 * Objeto compatível com import { transporter } from '@/lib/nodemailer'
 * Inclui cabeçalhos de entregabilidade (anti-spam) e retry automático em caso de queda de conexão SMTP.
 */
export const transporter = {
  sendMail: async (mailOptions) => {
    const user = (process.env.EMAIL_USER || '').trim();
    const refId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const domain = user.includes('@') ? user.split('@')[1] : 'gmail.com';

    const enrichedOptions = {
      replyTo: user || undefined,
      messageId: `<${refId}@${domain}>`,
      ...mailOptions,
      headers: {
        'X-Entity-Ref-ID': refId,
        ...(mailOptions.headers || {}),
      },
    };

    try {
      const t = getEmailTransporter();
      return await t.sendMail(enrichedOptions);
    } catch (firstErr) {
      // Se a conexão do pool caiu, recria o transporter e tenta mais uma vez
      cachedTransporter = null;
      const freshTransporter = getEmailTransporter();
      return await freshTransporter.sendMail(enrichedOptions);
    }
  },
  verify: async () => {
    const t = getEmailTransporter();
    return t.verify();
  },
};
