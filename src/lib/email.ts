import formData from 'form-data'
import Mailgun from 'mailgun.js'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

const mailgun = new Mailgun(formData)
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
})

const DOMAIN = process.env.MAILGUN_DOMAIN!

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  await mg.messages.create(DOMAIN, {
    from: process.env.MAILGUN_FROM || 'noreply@example.com',
    to: [to],
    subject,
    text,
    html,
  })
} 