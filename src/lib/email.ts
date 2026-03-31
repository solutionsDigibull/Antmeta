import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: `"AntMeta" <${process.env.SMTP_FROM}>`,
    to,
    subject: 'Your AntMeta verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0093B6;">AntMeta — Email Verification</h2>
        <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0093B6; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
