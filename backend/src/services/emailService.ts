import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpPort && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log('Nodemailer SMTP Transporter initialized');
} else {
  console.warn(
    'SMTP configuration missing. Email service will run in MOCK mode (logging to console).'
  );
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: `"Jira Lite Reminders" <${smtpUser}>`,
        to,
        subject,
        text,
      });
      console.log(`Email successfully sent to ${to}`);
    } else {
      console.log(`
=========================================
[MOCK EMAIL SENT]
To: ${to}
Subject: ${subject}
Date: ${new Date().toISOString()}
Body:
${text}
=========================================
      `);
    }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}
