import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendVerificationCode(to: string, code: string) {
  await transporter.sendMail({
    from: `"WayInvest" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${code} — код подтверждения WayInvest`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#111318;color:#E8E4DC;border-radius:16px;">
        <h1 style="color:#C9A84C;font-size:24px;margin-bottom:8px;">WayInvest</h1>
        <p style="color:#8A8680;font-size:14px;margin-bottom:24px;">Инвестиционная платформа Чечни</p>
        <p style="font-size:16px;margin-bottom:16px;">Ваш код подтверждения:</p>
        <div style="background:#222836;border:1px solid rgba(201,168,76,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:700;color:#C9A84C;letter-spacing:8px;">${code}</span>
        </div>
        <p style="color:#8A8680;font-size:13px;">Код действителен 10 минут. Если вы не запрашивали код — проигнорируйте это письмо.</p>
      </div>
    `,
  })
}
