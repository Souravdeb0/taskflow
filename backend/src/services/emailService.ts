import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587');
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
  console.log(`Nodemailer SMTP Transporter initialized (Host: ${host}:${port})`);
} else {
  console.warn('SMTP configuration missing. Email service will run in MOCK mode (logging to console).');
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"Jira Lite Reminders" <${user}>`,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      });
      console.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
      return info;
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
      return { mock: true, to, subject };
    }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}
