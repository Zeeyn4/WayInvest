'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'

function toRub(kopecks: bigint | null): number {
  return kopecks ? Number(kopecks) / 100 : 0
}

function toISO(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

function stageLabel(stage: string): string {
  if (stage === 'PRE_SEED') return 'Pre-seed'
  if (stage === 'ROUND_A') return 'Series A'
  return stage
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU')
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU')
}

function formatMoney(rubles: number): string {
  return `₽${rubles.toLocaleString('ru-RU')}`
}

async function requireStartup() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getStartupDashboardData() {
  const userId = await requireStartup()

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
      // Keep legacy keys used by current UI.
      views: startup.documentViews.length,
      responses: investorResponses,
      negotiations: activeNegotiations,
      aiRating: 82,
      // Keep explicit fields for future components.
      profileViews: startup.documentViews.length,
      uniqueInvestorViews: investorViewerIds.size,
      investorResponses,
      activeNegotiations,
      aiMatchScore: 82,
    },
    interests: [
      { label: 'Просмотры профиля', val: Math.min(100, startup.documentViews.length * 10) },
      { label: 'Скачивание PitchDeck', val: Math.min(100, startup.documents.length * 15) },
      { label: 'Запросы на встречу', val: Math.min(100, investorResponses * 20) },
      { label: 'Повторные просмотры', val: Math.min(100, Math.max(0, startup.documentViews.length - investorViewerIds.size) * 10) },
    ],
    recentResponses: chatMembers
      .filter((cm) => cm.chat.messages.length > 0)
      .slice(0, 4)
      .map((cm) => {
        const last = cm.chat.messages[0]
        return {
          name: 'Инвестор',
          text: last.content,
          time: fmtDateTime(toISO(last.createdAt)),
          badge: 'badge-green',
          badgeText: 'Новый отклик',
        }
      }),
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getStartupProfile() {
  const userId = await requireStartup()

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
    // Legacy keys for page UI
    months: startup.monthsOnMarket ?? 0,
    users: startup.usersCount ?? 0,
    arr: formatMoney(toRub(startup.arrAmount)),
    rating: 0,
    investmentNeed: formatMoney(toRub(startup.investmentNeeded)),
    team: startup.teamMembers.map((tm) => ({
      id: tm.id,
      name: tm.fullName,
      role: tm.role,
      initials: tm.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2),
    })),
    stats: {
      monthsOnMarket: startup.monthsOnMarket ?? 0,
      usersCount: startup.usersCount ?? 0,
      arrAmount: toRub(startup.arrAmount),
      rating: 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

export async function getStartupChats() {
  const userId = await requireStartup()

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
    date: fmtDate(toISO(e.dateTime)),
    time: new Date(e.dateTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    desc: e.description ?? '',
    participants: e.participants,
    registrations: e._count.registrations,
    createdAt: toISO(e.createdAt),
  }))
}

// ---------------------------------------------------------------------------
// Investor Catalog
// ---------------------------------------------------------------------------

export async function getInvestorCatalog() {
  await requireStartup()

  const investors = await prisma.investor.findMany({
    where: { verificationStatus: 'APPROVED', isActive: true },
    include: { user: { select: { fullName: true } } },
    orderBy: { rating: 'desc' },
  })

  return investors.map((inv) => ({
    id: inv.id,
    userId: inv.userId,
    name: inv.user.fullName,
    companyName: inv.companyName,
    sectorFocus: inv.sectorFocus,
    checkMin: 0,
    checkMax: 0,
    preferredStages: inv.preferredStages,
    region: inv.region,
    rating: 0,
    // Legacy keys consumed by startup dashboard UI
    focus: inv.sectorFocus.join(', ') || 'Без фокуса',
    check: '₽0',
    stage: inv.preferredStages.map((s) => stageLabel(s)).join(', ') || 'Pre-seed',
    status: 'Активен',
    aiScore: 0,
  }))
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function getStartupDocuments() {
  const userId = await requireStartup()

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

  const docs = startup.documents.map((doc) => ({
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

  // Legacy structure consumed by startup page.
  const files = docs.map((doc) => ({
    id: doc.id,
    icon: doc.fileName.toLowerCase().endsWith('.pdf') ? '📄' : '📊',
    name: doc.fileName,
    size: `${(doc.fileSizeMb ?? 0).toFixed(1)} MB`,
    date: fmtDate(doc.uploadedAt),
    fileUrl: doc.fileUrl,
    accessLevel: doc.accessLevel,
  }))

  const viewLog = docs.flatMap((doc) =>
    doc.views.map((v) => ({
      inv: v.investorName,
      doc: doc.fileName,
      date: fmtDate(v.viewedAt),
    }))
  )

  return { files, viewLog, raw: docs }
}

// ---------------------------------------------------------------------------
// NDAs
// ---------------------------------------------------------------------------

export async function getStartupNdas() {
  const userId = await requireStartup()

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
    // Legacy keys consumed by startup docs panel.
    investor: nda.investor.user.fullName,
    date: fmtDate(toISO(nda.signedAt)),
    status: 'Подписан',
    statusBadge: 'badge-green',
  }))
}

// ---------------------------------------------------------------------------
// Tariff
// ---------------------------------------------------------------------------

export async function getStartupTariff() {
  const userId = await requireStartup()

  const startup = await prisma.startup.findUnique({
    where: { userId },
    include: { tariff: true },
  })

  if (!startup) throw new Error('Startup not found')

  const allTariffs = await prisma.tariff.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  const currentSlug = startup.tariff?.slug ?? null
  const plans = allTariffs.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    price: toRub(t.priceMonthly),
    priceFormatted: toRub(t.priceMonthly) === 0 ? 'Бесплатно' : `₽${toRub(t.priceMonthly).toLocaleString('ru-RU')}`,
    isCurrent: currentSlug === t.slug,
    isFeatured: t.isFeatured,
    features: t.features,
  }))

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
    plans,
  }
}

// ---------------------------------------------------------------------------
// Tariff payment simulation (best-practice style)
// ---------------------------------------------------------------------------

export async function simulateTariffPayment(targetSlug: string) {
  const userId = await requireStartup()

  const startup = await prisma.startup.findUnique({
    where: { userId },
    include: { tariff: true },
  })
  if (!startup) throw new Error('Startup not found')

  const targetTariff = await prisma.tariff.findUnique({
    where: { slug: targetSlug },
  })
  if (!targetTariff || !targetTariff.isActive) {
    throw new Error('Тариф недоступен')
  }

  if (startup.tariffId === targetTariff.id) {
    return { ok: true, message: 'Тариф уже активен' }
  }

  // Simulate payment lifecycle:
  // 1) create audit "payment intent"
  // 2) apply tariff switch atomically
  // 3) create audit "payment success"
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        userId,
        action: 'TARIFF_PAYMENT_INTENT_CREATED',
        entity: 'tariff',
        entityId: targetTariff.id,
        meta: {
          startupId: startup.id,
          targetTariffSlug: targetTariff.slug,
          amountKopecks: targetTariff.priceMonthly.toString(),
          simulated: true,
        },
      },
    })

    await tx.startup.update({
      where: { id: startup.id },
      data: { tariffId: targetTariff.id },
    })

    await tx.auditLog.create({
      data: {
        userId,
        action: 'TARIFF_PAYMENT_SUCCEEDED',
        entity: 'tariff',
        entityId: targetTariff.id,
        meta: {
          startupId: startup.id,
          previousTariffSlug: startup.tariff?.slug ?? null,
          targetTariffSlug: targetTariff.slug,
          simulated: true,
        },
      },
    })
  })

  return { ok: true, message: `Тариф ${targetTariff.name} подключен` }
}

// ---------------------------------------------------------------------------
// Project documents upload (metadata-level)
// ---------------------------------------------------------------------------

export async function uploadStartupProjectFile(params: {
  fileName: string
  fileSizeMb: number
  accessLevel?: string
}) {
  const userId = await requireStartup()
  const startup = await prisma.startup.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!startup) throw new Error('Startup not found')

  const cleanFileName = params.fileName.trim()
  if (!cleanFileName) throw new Error('Укажите имя файла')

  const document = await prisma.document.create({
    data: {
      startupId: startup.id,
      fileName: cleanFileName,
      // Placeholder URL for local prototype mode.
      fileUrl: `/uploads/${Date.now()}-${cleanFileName.replace(/\s+/g, '_')}`,
      fileSizeMb: Number.isFinite(params.fileSizeMb) ? params.fileSizeMb : 0,
      accessLevel: params.accessLevel ?? 'nda',
      isActive: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STARTUP_DOCUMENT_UPLOADED',
      entity: 'document',
      entityId: document.id,
      meta: {
        startupId: startup.id,
        fileName: document.fileName,
        accessLevel: document.accessLevel,
      },
    },
  })

  return { ok: true, id: document.id }
}

// ---------------------------------------------------------------------------
// Startup -> Investor review
// ---------------------------------------------------------------------------

export async function createStartupInvestorReview(params: {
  investorId: string
  text: string
  rating: number
}) {
  const userId = await requireStartup()
  const startup = await prisma.startup.findUnique({
    where: { userId },
    select: { id: true, name: true },
  })
  if (!startup) throw new Error('Startup not found')

  const investor = await prisma.investor.findUnique({
    where: { id: params.investorId },
    select: { id: true },
  })
  if (!investor) throw new Error('Investor not found')

  const text = params.text.trim()
  if (!text) throw new Error('Текст отзыва пустой')

  const rating = Math.max(1, Math.min(5, Math.round(params.rating)))

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STARTUP_REVIEW_CREATED',
      entity: 'investor',
      entityId: investor.id,
      meta: {
        startupId: startup.id,
        author: startup.name,
        text,
        rating,
      },
    },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Startup requisites (view/edit from startup cabinet)
// ---------------------------------------------------------------------------

export async function getStartupRequisites() {
  const userId = await requireStartup()
  const startup = await prisma.startup.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!startup) throw new Error('Startup not found')

  const latest = await prisma.auditLog.findFirst({
    where: {
      action: 'STARTUP_REQUISITES_SAVED',
      entity: 'startup',
      entityId: startup.id,
    },
    orderBy: { createdAt: 'desc' },
  })

  const meta = (latest?.meta ?? {}) as Record<string, unknown>
  return {
    phone: typeof meta.phone === 'string' ? meta.phone : '',
    bankName: typeof meta.bankName === 'string' ? meta.bankName : '',
    accountNumber: typeof meta.accountNumber === 'string' ? meta.accountNumber : '',
    accountHolder: typeof meta.accountHolder === 'string' ? meta.accountHolder : '',
    updatedAt: latest?.createdAt ? toISO(latest.createdAt) : null,
  }
}

export async function saveStartupRequisites(params: {
  phone: string
  bankName: string
  accountNumber: string
  accountHolder: string
}) {
  const userId = await requireStartup()
  const startup = await prisma.startup.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!startup) throw new Error('Startup not found')

  const phone = params.phone.trim()
  const bankName = params.bankName.trim()
  const accountNumber = params.accountNumber.trim()
  const accountHolder = params.accountHolder.trim()
  if (!phone || !bankName || !accountNumber || !accountHolder) {
    throw new Error('Заполните все реквизиты')
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STARTUP_REQUISITES_SAVED',
      entity: 'startup',
      entityId: startup.id,
      meta: {
        phone,
        bankName,
        accountNumber,
        accountHolder,
      },
    },
  })

  return { ok: true }
}
