'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'

function toRub(kopecks: bigint | null): number {
  return kopecks ? Number(kopecks) / 100 : 0
}

function toISO(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden')
  return session.user
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getAdminDashboardData() {
  await requireAdmin()

  const [
    totalStartups,
    verifiedInvestors,
    pendingVerifications,
    recentPending,
  ] = await Promise.all([
    prisma.startup.count(),
    prisma.investor.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.investor.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.investor.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { fullName: true, email: true } },
        verificationDocs: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const monthlyCommissions = [
    { month: 'Январь 2026', amount: 0 },
    { month: 'Февраль 2026', amount: 0 },
    { month: 'Март 2026', amount: 0 },
    { month: 'Апрель 2026', amount: 0 },
    { month: 'Май 2026', amount: 0 },
  ]

  return {
    counts: {
      totalStartups,
      verifiedInvestors,
      pendingVerifications,
      totalCommissions: 0,
    },
    recentVerificationRequests: recentPending.map((inv) => ({
      id: inv.id,
      name: inv.user.fullName,
      email: inv.user.email,
      companyName: inv.companyName,
      ogrn: inv.ogrn,
      docsCount: inv.verificationDocs.length,
      createdAt: toISO(inv.createdAt),
    })),
    monthlyCommissions,
  }
}

// ---------------------------------------------------------------------------
// Verification Queue
// ---------------------------------------------------------------------------

export async function getVerificationQueue() {
  await requireAdmin()

  const investors = await prisma.investor.findMany({
    where: { verificationStatus: 'PENDING' },
    include: {
      user: { select: { fullName: true, email: true, createdAt: true } },
      verificationDocs: { orderBy: { uploadedAt: 'desc' } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return investors.map((inv) => ({
    id: inv.id,
    name: inv.user.fullName,
    email: inv.user.email,
    companyName: inv.companyName,
    ogrn: inv.ogrn,
    createdAt: toISO(inv.createdAt),
    userCreatedAt: toISO(inv.user.createdAt),
    documents: inv.verificationDocs.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      uploadedAt: toISO(doc.uploadedAt),
    })),
  }))
}

// ---------------------------------------------------------------------------
// Startups List
// ---------------------------------------------------------------------------

export async function getAdminStartups() {
  await requireAdmin()

  const startups = await prisma.startup.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      tariff: { select: { name: true } },
      _count: { select: { deals: true, documents: true, teamMembers: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return startups.map((s) => ({
    id: s.id,
    name: s.name,
    ownerName: s.user.fullName,
    ownerEmail: s.user.email,
    sector: s.sector,
    stage: s.stage,
    tariffName: s.tariff?.name ?? 'Free',
    isActive: s.isActive,
    investmentNeeded: toRub(s.investmentNeeded),
    dealsCount: s._count.deals,
    documentsCount: s._count.documents,
    teamSize: s._count.teamMembers,
    createdAt: toISO(s.createdAt),
  }))
}

// ---------------------------------------------------------------------------
// Investors List
// ---------------------------------------------------------------------------

export async function getAdminInvestors() {
  await requireAdmin()

  const investors = await prisma.investor.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      verificationDocs: { select: { id: true, fileName: true } },
      deals: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return investors.map((inv) => ({
    id: inv.id,
    name: inv.user.fullName,
    email: inv.user.email,
    companyName: inv.companyName,
    ogrn: inv.ogrn,
    verificationStatus: inv.verificationStatus,
    verifiedAt: toISO(inv.verifiedAt),
    docType: inv.verificationDocs.length > 0
      ? inv.verificationDocs[0].fileName
      : null,
    dealCount: inv.deals.length,
    totalInvested: toRub(inv.totalInvested),
    isActive: inv.isActive,
    createdAt: toISO(inv.createdAt),
  }))
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function getAdminEvents() {
  await requireAdmin()

  const events = await prisma.event.findMany({
    include: { _count: { select: { registrations: true } } },
    orderBy: { dateTime: 'desc' },
  })

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    emoji: e.emoji,
    description: e.description,
    dateTime: toISO(e.dateTime),
    participants: e.participants,
    registrations: e._count.registrations,
    isActive: e.isActive,
    createdAt: toISO(e.createdAt),
  }))
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

export async function getAdminCommissions() {
  await requireAdmin()

  const completedDeals = await prisma.deal.findMany({
    where: { status: 'COMPLETED' },
    include: {
      startup: { select: { name: true } },
      investor: {
        include: { user: { select: { fullName: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return {
    settings: {
      commissionRate: 0.08,
      description: '8% fixed commission on all completed deals',
    },
    transactions: completedDeals.map((d) => ({
      id: d.id,
      startupName: d.startup.name,
      investorName: d.investor.user.fullName,
      dealAmount: 0,
      commissionRate: d.commissionRate,
      commissionAmount: 0,
      totalAmount: 0,
      completedAt: toISO(d.updatedAt),
    })),
  }
}

// ---------------------------------------------------------------------------
// Tariffs
// ---------------------------------------------------------------------------

export async function getAdminTariffs() {
  await requireAdmin()

  const tariffs = await prisma.tariff.findMany({
    include: { _count: { select: { startups: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  return tariffs.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    priceMonthly: toRub(t.priceMonthly),
    features: t.features,
    isFeatured: t.isFeatured,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
    subscriberCount: 0,
    monthlyRevenue: 0,
    createdAt: toISO(t.createdAt),
  }))
}

export async function getAdminStartupRequisites() {
  await requireAdmin()

  const startups = await prisma.startup.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const requisitesLogs = await prisma.auditLog.findMany({
    where: {
      action: 'STARTUP_REQUISITES_SAVED',
      entity: 'startup',
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const latestByStartupId = new Map<string, any>()
  for (const log of requisitesLogs) {
    if (!log.entityId || latestByStartupId.has(log.entityId)) continue
    latestByStartupId.set(log.entityId, log)
  }

  return startups.map((s) => {
    const log = latestByStartupId.get(s.id)
    const meta = (log?.meta ?? {}) as Record<string, unknown>
    return {
      startupId: s.id,
      startupName: s.name,
      founderName: s.user.fullName,
      founderEmail: s.user.email,
      phone: typeof meta.phone === 'string' ? meta.phone : '—',
      bankName: typeof meta.bankName === 'string' ? meta.bankName : '—',
      accountNumber: typeof meta.accountNumber === 'string' ? meta.accountNumber : '—',
      accountHolder: typeof meta.accountHolder === 'string' ? meta.accountHolder : '—',
      updatedAt: log?.createdAt ? toISO(log.createdAt) : null,
      isActive: s.isActive,
    }
  })
}

// ---------------------------------------------------------------------------
// Approve / Reject Investor
// ---------------------------------------------------------------------------

export async function approveInvestor(investorId: string) {
  const admin = await requireAdmin()

  const investor = await prisma.investor.update({
    where: { id: investorId },
    data: {
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
    },
    include: { user: { select: { fullName: true } } },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'APPROVE_INVESTOR',
      entity: 'investor',
      entityId: investorId,
    },
  })

  return {
    id: investor.id,
    name: investor.user.fullName,
    verificationStatus: investor.verificationStatus,
    verifiedAt: toISO(investor.verifiedAt),
  }
}

export async function rejectInvestor(investorId: string) {
  const admin = await requireAdmin()

  const investor = await prisma.investor.update({
    where: { id: investorId },
    data: {
      verificationStatus: 'REJECTED',
    },
    include: { user: { select: { fullName: true } } },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'REJECT_INVESTOR',
      entity: 'investor',
      entityId: investorId,
    },
  })

  return {
    id: investor.id,
    name: investor.user.fullName,
    verificationStatus: investor.verificationStatus,
  }
}
