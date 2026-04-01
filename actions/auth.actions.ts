'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { signIn } from '@/lib/auth'
import { registerStartupSchema, registerInvestorSchema, loginSchema } from '@/lib/validators/auth'
import { Role } from '@prisma/client'

export type ActionResult = {
  success: boolean
  error?: string
  redirect?: string
}

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

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Пользователь с таким email уже существует' }
  }

  const passwordHash = await hash(password, 12)

  // Find free tariff
  const freeTariff = await prisma.tariff.findUnique({ where: { slug: 'basic' } })

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.STARTUP,
      fullName,
      startup: {
        create: {
          name: startupName,
          sector,
          tariffId: freeTariff?.id ?? undefined,
        },
      },
    },
  })

  // Auto sign-in after registration
  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch {
    // signIn may throw on redirect — that's OK
  }

  return { success: true, redirect: '/startup' }
}

export async function registerInvestor(formData: FormData): Promise<ActionResult> {
  const raw = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    companyName: formData.get('companyName') as string,
    ogrn: formData.get('ogrn') as string,
  }

  const parsed = registerInvestorSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { fullName, email, password, companyName, ogrn } = parsed.data

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
      investor: {
        create: {
          companyName,
          ogrn,
        },
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
