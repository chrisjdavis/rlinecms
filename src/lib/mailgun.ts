import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
  url: 'https://api.mailgun.net',
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Local type for the subset of Mailgun message fields you use
interface MailgunMessageData {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMailgunEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!process.env.MAILGUN_DOMAIN || !process.env.MAILGUN_FROM_EMAIL) {
    throw new Error('Mailgun domain or from email not set in environment variables');
  }

  const message: MailgunMessageData = {
    from: process.env.MAILGUN_FROM_EMAIL!,
    to,
    subject,
    text,
    html,
  };

  return mg.messages.create(
    process.env.MAILGUN_DOMAIN,
    message as Parameters<typeof mg.messages.create>[1]
  );
} 