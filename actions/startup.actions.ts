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

export async function getStartupDashboardData() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const startup = await prisma.startup.findUnique({
    where: { userId },
    include: {
      tariff: true,
      teamMembers: true,
      documents: { where: { isActive: true }, include: { views: true } },
      ndaAgreements: { include: { investor: { include: { user: true } } } },
      documentViews: {
        include: { investor: { include: { user: true } } },
        orderBy: { viewedAt: 'desc' },
      },
    },
  })

  if (!startup) throw new Error('Startup not found')

  // Chats where this user is a member (for stats)
  const chatMembers = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  })

  const activeNegotiations = chatMembers.length
  const investorResponses = chatMembers.filter(
    (cm) => cm.chat.messages.length > 0
  ).length

  // Unique investors who viewed documents
  const investorViewerIds = new Set(
    startup.documentViews.map((v) => v.investorId)
  )

  return {
    startup: {
      id: startup.id,
      name: startup.name,
      sector: startup.sector,
      stage: startup.stage,
      description: startup.description,
      investmentNeeded: toRub(startup.investmentNeeded),
      isActive: startup.isActive,
      createdAt: toISO(startup.createdAt),
    },
    tariff: startup.tariff
      ? {
          id: startup.tariff.id,
          name: startup.tariff.name,
          slug: startup.tariff.slug,
          priceMonthly: toRub(startup.tariff.priceMonthly),
          features: startup.tariff.features,
        }
      : null,
    teamMembers: startup.teamMembers.map((tm) => ({
      id: tm.id,
      fullName: tm.fullName,
      role: tm.role,
    })),
    documents: startup.documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSizeMb: doc.fileSizeMb,
      accessLevel: doc.accessLevel,
      uploadedAt: toISO(doc.uploadedAt),
      viewsCount: doc.views.length,
    })),
    ndaAgreements: startup.ndaAgreements.map((nda) => ({
      id: nda.id,
      investorName: nda.investor.user.fullName,
      signedAt: toISO(nda.signedAt),
    })),
    recentViewers: startup.documentViews.slice(0, 10).map((v) => ({
      id: v.id,
      investorName: v.investor.user.fullName,
      viewedAt: toISO(v.viewedAt),
      durationSec: v.durationSec,
    })),
    stats: {
      profileViews: startup.documentViews.length,
      uniqueInvestorViews: investorViewerIds.size,
      investorResponses,
      activeNegotiations,
      aiMatchScore: 82,
    },
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getStartupProfile() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const startup = await prisma.startup.findUnique({
    where: { userId },
    include: { teamMembers: true },
  })

  if (!startup) throw new Error('Startup not found')

  return {
    id: startup.id,
    name: startup.name,
    sector: startup.sector,
    stage: startup.stage,
    description: startup.description,
    investmentNeeded: toRub(startup.investmentNeeded),
    tags: startup.tags,
    teamMembers: startup.teamMembers.map((tm) => ({
      id: tm.id,
      fullName: tm.fullName,
      role: tm.role,
    })),
    stats: {
      monthsOnMarket: startup.monthsOnMarket,
      usersCount: startup.usersCount,
      arrAmount: toRub(startup.arrAmount),
      rating: startup.rating,
    },
  }
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

export async function getStartupChats() {
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
// Events
// ---------------------------------------------------------------------------

export async function getStartupEvents() {
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

// ---------------------------------------------------------------------------
// Investor Catalog
// ---------------------------------------------------------------------------

export async function getInvestorCatalog() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const investors = await prisma.investor.findMany({
    where: { verificationStatus: 'APPROVED', isActive: true },
    include: { user: { select: { fullName: true } } },
    orderBy: { rating: 'desc' },
  })

  return investors.map((inv) => ({
    id: inv.id,
    name: inv.user.fullName,
    companyName: inv.companyName,
    sectorFocus: inv.sectorFocus,
    checkMin: toRub(inv.checkMin),
    checkMax: toRub(inv.checkMax),
    preferredStages: inv.preferredStages,
    region: inv.region,
    rating: inv.rating,
  }))
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function getStartupDocuments() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const startup = await prisma.startup.findUnique({
    where: { userId },
    include: {
      documents: {
        where: { isActive: true },
        include: {
          views: {
            include: {
              investor: { include: { user: { select: { fullName: true } } } },
            },
            orderBy: { viewedAt: 'desc' },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  })

  if (!startup) throw new Error('Startup not found')

  return startup.documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    fileSizeMb: doc.fileSizeMb,
    accessLevel: doc.accessLevel,
    uploadedAt: toISO(doc.uploadedAt),
    views: doc.views.map((v) => ({
      id: v.id,
      investorName: v.investor.user.fullName,
      viewedAt: toISO(v.viewedAt),
      durationSec: v.durationSec,
    })),
  }))
}

// ---------------------------------------------------------------------------
// NDAs
// ---------------------------------------------------------------------------

export async function getStartupNdas() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const startup = await prisma.startup.findUnique({
    where: { userId },
  })

  if (!startup) throw new Error('Startup not found')

  const ndas = await prisma.ndaAgreement.findMany({
    where: { startupId: startup.id },
    include: {
      investor: {
        include: { user: { select: { fullName: true, email: true } } },
      },
    },
    orderBy: { signedAt: 'desc' },
  })

  return ndas.map((nda) => ({
    id: nda.id,
    investorId: nda.investorId,
    investorName: nda.investor.user.fullName,
    investorEmail: nda.investor.user.email,
    signedAt: toISO(nda.signedAt),
  }))
}

// ---------------------------------------------------------------------------
// Tariff
// ---------------------------------------------------------------------------

export async function getStartupTariff() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const startup = await prisma.startup.findUnique({
    where: { userId },
    include: { tariff: true },
  })

  if (!startup) throw new Error('Startup not found')

  const allTariffs = await prisma.tariff.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return {
    current: startup.tariff
      ? {
          id: startup.tariff.id,
          name: startup.tariff.name,
          slug: startup.tariff.slug,
          priceMonthly: toRub(startup.tariff.priceMonthly),
          features: startup.tariff.features,
          isFeatured: startup.tariff.isFeatured,
        }
      : null,
    available: allTariffs.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      priceMonthly: toRub(t.priceMonthly),
      features: t.features,
      isFeatured: t.isFeatured,
      sortOrder: t.sortOrder,
    })),
  }
}
