'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'

function toRub(kopecks: bigint | null): number {
  return kopecks ? Number(kopecks) / 100 : 0
}

function toISO(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getInvestorDashboardData() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const investor = await prisma.investor.findUnique({
    where: { userId },
    include: {
      deals: { include: { startup: true } },
      documentViews: true,
    },
  })

  if (!investor) throw new Error('Investor not found')

  // Chats count (active negotiations)
  const chatMemberCount = await prisma.chatMember.count({
    where: { userId },
  })

  const completedDeals = investor.deals.filter((d) => d.status === 'COMPLETED')
  const startupsViewed = new Set(investor.documentViews.map((v) => v.startupId))

  // AI recommendations -- first 2 active startups as placeholder
  const recommendedStartups = await prisma.startup.findMany({
    where: { isActive: true },
    take: 2,
    orderBy: { rating: 'desc' },
  })

  // Commission info: 8% platform commission
  const totalCommissionKopecks = completedDeals.reduce(
    (sum, d) => sum + Number(d.commissionAmount),
    0
  )

  return {
    stats: {
      startupsViewed: startupsViewed.size,
      activeNegotiations: chatMemberCount,
      completedDeals: completedDeals.length,
      totalInvested: toRub(investor.totalInvested),
    },
    recommendations: recommendedStartups.map((s, i) => ({
      id: s.id,
      name: s.name,
      sector: s.sector,
      stage: s.stage,
      investmentNeeded: toRub(s.investmentNeeded),
      arrAmount: toRub(s.arrAmount),
      rating: s.rating,
      matchScore: i === 0 ? 92 : 87,
    })),
    commission: {
      rate: 0.08,
      totalPaid: totalCommissionKopecks / 100,
    },
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getInvestorProfile() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const investor = await prisma.investor.findUnique({
    where: { userId },
    include: {
      user: { select: { fullName: true, email: true, createdAt: true } },
      deals: { where: { status: 'COMPLETED' } },
    },
  })

  if (!investor) throw new Error('Investor not found')

  const reviewLogs = await prisma.auditLog.findMany({
    where: {
      action: 'STARTUP_REVIEW_CREATED',
      entity: 'investor',
      entityId: investor.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const reviews = reviewLogs
    .map((log) => {
      const meta = (log.meta ?? {}) as Record<string, unknown>
      const author = typeof meta.author === 'string' ? meta.author : 'Стартап'
      const text = typeof meta.text === 'string' ? meta.text : ''
      const ratingRaw = typeof meta.rating === 'number' ? meta.rating : 0
      const rating = Math.max(1, Math.min(5, Math.round(ratingRaw)))
      if (!text) return null
      return { author, text, rating }
    })
    .filter(Boolean) as { author: string; text: string; rating: number }[]

  return {
    id: investor.id,
    name: investor.user.fullName,
    email: investor.user.email,
    companyName: investor.companyName,
    ogrn: investor.ogrn,
    verificationStatus: investor.verificationStatus,
    verifiedAt: toISO(investor.verifiedAt),
    sectorFocus: investor.sectorFocus,
    checkMin: toRub(investor.checkMin),
    checkMax: toRub(investor.checkMax),
    preferredStages: investor.preferredStages,
    region: investor.region,
    rating: 0,
    totalInvested: toRub(investor.totalInvested),
    completedDeals: investor.deals.length,
    memberSince: toISO(investor.user.createdAt),
    reviews,
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export async function getInvestorVerification() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const investor = await prisma.investor.findUnique({
    where: { userId },
    include: { verificationDocs: { orderBy: { uploadedAt: 'desc' } } },
  })

  if (!investor) throw new Error('Investor not found')

  return {
    verificationStatus: investor.verificationStatus,
    companyName: investor.companyName,
    ogrn: investor.ogrn,
    verifiedAt: toISO(investor.verifiedAt),
    documents: investor.verificationDocs.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      uploadedAt: toISO(doc.uploadedAt),
    })),
  }
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

export async function getInvestorChats() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const chatMembers = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          members: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return chatMembers.map((cm) => {
    const partner = cm.chat.members.find((m) => m.userId !== userId)
    const lastMsg = cm.chat.messages[0] ?? null

    return {
      chatId: cm.chat.id,
      partnerName: partner?.user.fullName ?? 'Unknown',
      partnerId: partner?.userId ?? null,
      partnerRole: partner?.user.role ?? null,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            createdAt: toISO(lastMsg.createdAt),
            isMine: lastMsg.senderId === userId,
          }
        : null,
      createdAt: toISO(cm.chat.createdAt),
    }
  })
}

// ---------------------------------------------------------------------------
// Startup Catalog
// ---------------------------------------------------------------------------

export async function getStartupCatalog() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const startups = await prisma.startup.findMany({
    where: { isActive: true },
    include: { teamMembers: true },
    orderBy: { rating: 'desc' },
  })

  return startups.map((s, i) => ({
    id: s.id,
    userId: s.userId,
    name: s.name,
    emoji: '\uD83D\uDE80', // placeholder
    sector: s.sector,
    stage: s.stage,
    description: s.description,
    investmentNeeded: toRub(s.investmentNeeded),
    arrAmount: toRub(s.arrAmount),
    monthsOnMarket: s.monthsOnMarket,
    usersCount: s.usersCount,
    rating: s.rating,
    tags: s.tags,
    teamSize: s.teamMembers.length,
    matchScore: Math.max(95 - i * 5, 60), // deterministic placeholder
  }))
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function getInvestorDeals() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const investor = await prisma.investor.findUnique({
    where: { userId },
  })

  if (!investor) throw new Error('Investor not found')

  const deals = await prisma.deal.findMany({
    where: { investorId: investor.id },
    include: { startup: { select: { name: true, sector: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return deals.map((d) => ({
    id: d.id,
    startupName: d.startup.name,
    startupSector: d.startup.sector,
    amount: toRub(d.amount),
    commissionRate: d.commissionRate,
    commissionAmount: toRub(d.commissionAmount),
    totalAmount: toRub(d.totalAmount),
    status: d.status,
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  }))
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function getInvestorEvents() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    include: { _count: { select: { registrations: true } } },
    orderBy: { dateTime: 'asc' },
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
    createdAt: toISO(e.createdAt),
  }))
}
