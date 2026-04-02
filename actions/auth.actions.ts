'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { signIn } from '@/lib/auth'
import { registerStartupSchema, registerInvestorSchema, loginSchema } from '@/lib/validators/auth'
import { Role } from '@prisma/client'
import { sendVerificationCode } from '@/lib/services/email.service'

export type ActionResult = {
  success: boolean
  error?: string
  redirect?: string
  step?: 'verify' // indicates need to verify email
}

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ============================================================
// STEP 1: Send verification code to email
// ============================================================

export async function sendEmailCode(email: string): Promise<ActionResult> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Некорректный email' }
  }

  // Delete old codes for this email
  await prisma.emailVerification.deleteMany({ where: { email } })

  const code = generateCode()

  await prisma.emailVerification.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  })

  try {
    await sendVerificationCode(email, code)
  } catch (e) {
    console.error('Email send error:', e)
    return { success: false, error: 'Не удалось отправить код. Попробуйте позже.' }
  }

  return { success: true }
}

// ============================================================
// STEP 2: Verify code
// ============================================================

export async function verifyEmailCode(email: string, code: string): Promise<ActionResult> {
  const record = await prisma.emailVerification.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!record) {
    return { success: false, error: 'Неверный или истёкший код' }
  }

  // Mark as used
  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { used: true },
  })

  return { success: true }
}

// ============================================================
// STEP 3: Register (after email verified)
// ============================================================

export async function registerStartup(formData: FormData): Promise<ActionResult> {
  const raw = {
    startupName: formData.get('startupName') as string,
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    sector: formData.get('sector') as string,
  }

  const parsed = registerStartupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { startupName, fullName, email, password, sector } = parsed.data

  // Check email was verified
  const verified = await prisma.emailVerification.findFirst({
    where: { email, used: true },
    orderBy: { createdAt: 'desc' },
  })
  if (!verified) {
    return { success: false, error: 'Email не подтверждён' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Пользователь с таким email уже существует' }
  }

  const passwordHash = await hash(password, 12)
  const freeTariff = await prisma.tariff.findUnique({ where: { slug: 'basic' } })

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.STARTUP,
      fullName,
      emailVerified: true,
      startup: {
        create: {
          name: startupName,
          sector,
          tariffId: freeTariff?.id ?? undefined,
        },
      },
    },
  })

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch {
    // signIn may throw on redirect
  }

  return { success: true, redirect: '/startup' }
}

export async function registerInvestor(formData: FormData): Promise<ActionResult> {
  const raw = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = registerInvestorSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fullName, email, password } = parsed.data

  // Check email was verified
  const verified = await prisma.emailVerification.findFirst({
    where: { email, used: true },
    orderBy: { createdAt: 'desc' },
  })
  if (!verified) {
    return { success: false, error: 'Email не подтверждён' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Пользователь с таким email уже существует' }
  }

  const passwordHash = await hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.INVESTOR,
      fullName,
      emailVerified: true,
      investor: {
        create: {},
      },
    },
  })

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch {
    // OK
  }

  return { success: true, redirect: '/investor' }
}

// ============================================================
// LOGIN
// ============================================================

export async function loginUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const user = await prisma.user.findUnique({
    where: { email: raw.email, isActive: true },
  })

  if (!user) {
    return { success: false, error: 'Неверный email или пароль' }
  }

  try {
    await signIn('credentials', {
      email: raw.email,
      password: raw.password,
      redirect: false,
    })
  } catch {
    return { success: false, error: 'Неверный email или пароль' }
  }

  const redirectMap: Record<string, string> = {
    STARTUP: '/startup',
    INVESTOR: '/investor',
    ADMIN: '/admin',
  }

  return { success: true, redirect: redirectMap[user.role] || '/' }
}
