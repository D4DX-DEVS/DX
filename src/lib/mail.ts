import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const globalForMail = globalThis as unknown as { __smtp?: Transporter };

/** One pooled SMTP transport per process (survives dev hot reloads). Null when SMTP is not configured. */
function transport(): Transporter | null {
  if (globalForMail.__smtp) return globalForMail.__smtp;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = env();
  if (!SMTP_HOST) return null;
  globalForMail.__smtp = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    pool: true,
  });
  return globalForMail.__smtp;
}

export interface MailInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** Sends one email. Returns false (and logs) when SMTP is not configured; throws when the server rejects it. */
export async function sendMail({ to, subject, text, html, replyTo }: MailInput): Promise<boolean> {
  const smtp = transport();
  if (!smtp) {
    logger.warn("mail skipped: SMTP_HOST is not set", { subject });
    return false;
  }
  const { SMTP_FROM, SMTP_USER } = env();
  await smtp.sendMail({ from: SMTP_FROM ?? SMTP_USER, to, subject, text, html, replyTo });
  return true;
}
