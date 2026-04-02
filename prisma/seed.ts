import { PrismaClient, Role, VerificationStatus, StartupStage, DealStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await hash('password123', 12)

  // ============================================================
  // 1. TARIFFS
  // ============================================================
  const tariffs = [
    { name: 'Базовый', slug: 'basic', priceMonthly: BigInt(0), features: ['Профиль стартапа', 'Базовое описание проекта', 'Доступ к каталогу инвесторов', 'Получение откликов'], isFeatured: false, sortOrder: 1 },
    { name: 'Стартовый', slug: 'starter', priceMonthly: BigInt(490000), features: ['Всё из Базового', 'Приоритет в поиске', 'Расширенная аналитика просмотров', 'AI-подбор инвесторов', 'Статистика интереса'], isFeatured: false, sortOrder: 2 },
    { name: 'Премиум', slug: 'premium', priceMonthly: BigInt(1290000), features: ['Всё из Стартового', 'Индивидуальная консультация', 'Помощь в оформлении документов', 'NDA + водяные знаки', 'Ограниченный доступ к файлам', 'Высший приоритет AI-подбора'], isFeatured: true, sortOrder: 3 },
    { name: 'Элит', slug: 'elite', priceMonthly: BigInt(2990000), features: ['Всё из Премиум', 'Персональный менеджер', 'Участие в закрытых питч-сессиях', 'Featured-размещение на главной', 'Прямой выход на топ-инвесторов', 'Юридическое сопровождение сделки'], isFeatured: false, sortOrder: 4 },
  ]

  const tariffMap: Record<string, string> = {}
  for (const t of tariffs) {
    const created = await prisma.tariff.upsert({
      where: { slug: t.slug },
      update: { name: t.name, priceMonthly: t.priceMonthly, features: t.features, isFeatured: t.isFeatured, sortOrder: t.sortOrder },
      create: t,
    })
    tariffMap[t.slug] = created.id
  }
  console.log('Tariffs seeded.')

  // ============================================================
  // 2. ADMIN
  // ============================================================
  const adminHash = await hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@wayinvest.ru' },
    update: {},
    create: {
      email: 'admin@wayinvest.ru',
      passwordHash: adminHash,
      role: Role.ADMIN,
      fullName: 'Администратор',
    },
  })
  console.log('Admin seeded: admin@wayinvest.ru / admin123')

  // ============================================================
  // 3. STARTUPS (from prototype)
  // ============================================================

  // Startup 1: ТехЧечня — Алихан Мусаев
  const startup1User = await prisma.user.upsert({
    where: { email: 'alihan@techchechnya.ru' },
    update: {},
    create: {
      email: 'alihan@techchechnya.ru',
      passwordHash,
      role: Role.STARTUP,
      fullName: 'Алихан Мусаев',
    },
  })
  const startup1 = await prisma.startup.upsert({
    where: { userId: startup1User.id },
    update: {},
    create: {
      userId: startup1User.id,
      name: 'ТехЧечня',
      sector: 'IT / Маркетплейс',
      stage: StartupStage.PRE_SEED,
      description: 'Онлайн-платформа для поиска и заказа локальных услуг в Грозном и регионе. Стадия: Pre-seed. Ищем ₽5–15 млн инвестиций.',
      investmentNeeded: BigInt(1000000000), // 10M руб в копейках
      arrAmount: BigInt(420000000),          // 4.2M
      monthsOnMarket: 38,
      usersCount: 1200,
      rating: 4.8,
      tags: ['IT', 'Маркетплейс', 'B2C', 'Грозный', 'Mobile-first', 'Pre-seed'],
      tariffId: tariffMap['starter'],
    },
  })

  // Team members for ТехЧечня
  const existingTeam1 = await prisma.teamMember.findFirst({ where: { startupId: startup1.id, fullName: 'Алихан Мусаев' } })
  if (!existingTeam1) {
    await prisma.teamMember.createMany({
      data: [
        { startupId: startup1.id, fullName: 'Алихан Мусаев', role: 'CEO, сооснователь' },
        { startupId: startup1.id, fullName: 'Лейла Абдулаева', role: 'CTO, сооснователь' },
      ],
    })
  }

  // Startup 2: ГрозАгро
  const startup2User = await prisma.user.upsert({
    where: { email: 'isa@grozagro.ru' },
    update: {},
    create: {
      email: 'isa@grozagro.ru',
      passwordHash,
      role: Role.STARTUP,
      fullName: 'Иса Тумхаджиев',
    },
  })
  const startup2 = await prisma.startup.upsert({
    where: { userId: startup2User.id },
    update: {},
    create: {
      userId: startup2User.id,
      name: 'ГрозАгро',
      sector: 'Агротех',
      stage: StartupStage.SEED,
      description: 'Платформа для прямых продаж сельскохозяйственной продукции фермерами конечным потребителям. 340 фермеров, 12 000 покупателей в ЧР.',
      investmentNeeded: BigInt(1200000000),
      arrAmount: BigInt(840000000),
      monthsOnMarket: 24,
      usersCount: 12000,
      rating: 4.7,
      tags: ['Агротех', 'Маркетплейс', 'B2C', 'Грозный', 'Seed'],
      tariffId: tariffMap['premium'],
    },
  })

  // Startup 3: ЧечняФинтех
  const startup3User = await prisma.user.upsert({
    where: { email: 'adam@chechnyafintech.ru' },
    update: {},
    create: {
      email: 'adam@chechnyafintech.ru',
      passwordHash,
      role: Role.STARTUP,
      fullName: 'Адам Кадыров',
    },
  })
  await prisma.startup.upsert({
    where: { userId: startup3User.id },
    update: {},
    create: {
      userId: startup3User.id,
      name: 'ЧечняФинтех',
      sector: 'Финтех',
      stage: StartupStage.PRE_SEED,
      description: 'Финтех-платформа для микрокредитования малого бизнеса в ЧР.',
      investmentNeeded: BigInt(600000000),
      arrAmount: BigInt(180000000),
      tags: ['Финтех', 'B2B', 'Pre-seed'],
      tariffId: tariffMap['basic'],
    },
  })

  // Startup 4: ДорогиЧР
  const startup4User = await prisma.user.upsert({
    where: { email: 'magomed@dorogichr.ru' },
    update: {},
    create: {
      email: 'magomed@dorogichr.ru',
      passwordHash,
      role: Role.STARTUP,
      fullName: 'Магомед Исаев',
    },
  })
  await prisma.startup.upsert({
    where: { userId: startup4User.id },
    update: {},
    create: {
      userId: startup4User.id,
      name: 'ДорогиЧР',
      sector: 'Логистика',
      stage: StartupStage.SEED,
      description: 'Логистическая платформа для оптимизации грузоперевозок по Чеченской Республике.',
      investmentNeeded: BigInt(1800000000),
      arrAmount: BigInt(1100000000),
      tags: ['Логистика', 'B2B', 'Seed'],
      tariffId: tariffMap['basic'],
    },
  })

  console.log('Startups seeded.')

  // ============================================================
  // 4. INVESTORS (from prototype)
  // ============================================================

  // Investor 1: Рустам Бекмурзаев — verified
  const inv1User = await prisma.user.upsert({
    where: { email: 'rustam@investor.ru' },
    update: {},
    create: {
      email: 'rustam@investor.ru',
      passwordHash,
      role: Role.INVESTOR,
      fullName: 'Рустам Бекмурзаев',
    },
  })
  const inv1 = await prisma.investor.upsert({
    where: { userId: inv1User.id },
    update: {},
    create: {
      userId: inv1User.id,
      companyName: 'ИП Бекмурзаев Р.А.',
      ogrn: '321619600026782',
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date('2024-12-05'),
      sectorFocus: ['IT', 'Ритейл'],
      checkMin: BigInt(500000000),
      checkMax: BigInt(2000000000),
      preferredStages: [StartupStage.PRE_SEED, StartupStage.SEED],
      region: 'Чеченская Республика, СКФО',
      rating: 4.9,
      totalInvested: BigInt(4200000000),
    },
  })

  // Investor 2: Магомед Ахматов — verified
  const inv2User = await prisma.user.upsert({
    where: { email: 'magomed@investor.ru' },
    update: {},
    create: {
      email: 'magomed@investor.ru',
      passwordHash,
      role: Role.INVESTOR,
      fullName: 'Магомед Ахматов',
    },
  })
  const inv2 = await prisma.investor.upsert({
    where: { userId: inv2User.id },
    update: {},
    create: {
      userId: inv2User.id,
      companyName: 'ИП Ахматов М.С.',
      ogrn: '321619600026783',
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date('2024-11-20'),
      sectorFocus: ['Финтех', 'IT'],
      checkMin: BigInt(200000000),
      checkMax: BigInt(800000000),
      preferredStages: [StartupStage.PRE_SEED],
      region: 'Чеченская Республика',
      rating: 4.7,
      totalInvested: BigInt(800000000),
    },
  })

  // Investor 3: Зулай Алиева — verified
  const inv3User = await prisma.user.upsert({
    where: { email: 'zulay@investor.ru' },
    update: {},
    create: {
      email: 'zulay@investor.ru',
      passwordHash,
      role: Role.INVESTOR,
      fullName: 'Зулай Алиева',
    },
  })
  await prisma.investor.upsert({
    where: { userId: inv3User.id },
    update: {},
    create: {
      userId: inv3User.id,
      companyName: 'ИП Алиева З.М.',
      ogrn: '321619600026784',
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date('2024-11-15'),
      sectorFocus: ['Агротех', 'Экология'],
      checkMin: BigInt(1000000000),
      checkMax: BigInt(3000000000),
      preferredStages: [StartupStage.SEED, StartupStage.ROUND_A],
      region: 'СКФО',
      rating: 4.8,
      totalInvested: BigInt(0),
    },
  })

  // Investor 4: Беслан Хасанов — verified
  const inv4User = await prisma.user.upsert({
    where: { email: 'beslan@investor.ru' },
    update: {},
    create: {
      email: 'beslan@investor.ru',
      passwordHash,
      role: Role.INVESTOR,
      fullName: 'Беслан Хасанов',
    },
  })
  await prisma.investor.upsert({
    where: { userId: inv4User.id },
    update: {},
    create: {
      userId: inv4User.id,
      companyName: 'ООО «ГрозИнвест»',
      ogrn: '7205105008',
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date('2024-10-20'),
      sectorFocus: ['Логистика'],
      checkMin: BigInt(500000000),
      checkMax: BigInt(1500000000),
      preferredStages: [StartupStage.PRE_SEED, StartupStage.SEED],
      region: 'Чеченская Республика',
      rating: 4.6,
      totalInvested: BigInt(0),
    },
  })

  // Pending investors (for admin verification queue)
  const pendInv1User = await prisma.user.upsert({
    where: { email: 'daud@investor.ru' },
    update: {},
    create: {
      email: 'daud@investor.ru',
      passwordHash,
      role: Role.INVESTOR,
      fullName: 'Дауд Мусаев',
    },
  })
  await prisma.investor.upsert({
    where: { userId: pendInv1User.id },
    update: {},
    create: {
      userId: pendInv1User.id,
      companyName: 'ИП Мусаев Д.Ш.',
      ogrn: '321619600026001',
      verificationStatus: VerificationStatus.PENDING,
    },
  })

  const pendInv2User = await prisma.user.upsert({
    where: { email: 'aisha@investor.ru' },
    update: {},
    create: {
      email: 'aisha@investor.ru',
      passwordHash,
      role: Role.INVESTOR,
      fullName: 'Аиша Алиева',
    },
  })
  await prisma.investor.upsert({
    where: { userId: pendInv2User.id },
    update: {},
    create: {
      userId: pendInv2User.id,
      companyName: 'ИП Алиева А.Р.',
      ogrn: '321619600026002',
      verificationStatus: VerificationStatus.PENDING,
    },
  })

  console.log('Investors seeded.')

  // ============================================================
  // 5. DEALS (from prototype)
  // ============================================================
  const existingDeals = await prisma.deal.count()
  if (existingDeals === 0) {
    await prisma.deal.createMany({
      data: [
        {
          investorId: inv1.id,
          startupId: startup1.id,
          amount: BigInt(1500000000),
          commissionRate: 0.08,
          commissionAmount: BigInt(120000000),
          totalAmount: BigInt(1620000000),
          status: DealStatus.COMPLETED,
          createdAt: new Date('2024-11-01'),
        },
        {
          investorId: inv1.id,
          startupId: startup2.id,
          amount: BigInt(2700000000),
          commissionRate: 0.08,
          commissionAmount: BigInt(216000000),
          totalAmount: BigInt(2916000000),
          status: DealStatus.COMPLETED,
          createdAt: new Date('2024-09-15'),
        },
        {
          investorId: inv2.id,
          startupId: startup1.id,
          amount: BigInt(800000000),
          commissionRate: 0.08,
          commissionAmount: BigInt(64000000),
          totalAmount: BigInt(864000000),
          status: DealStatus.COMPLETED,
          createdAt: new Date('2024-08-03'),
        },
      ],
    })
    console.log('Deals seeded.')
  }

  // ============================================================
  // 6. NDA AGREEMENTS
  // ============================================================
  const existingNda = await prisma.ndaAgreement.count()
  if (existingNda === 0) {
    await prisma.ndaAgreement.createMany({
      data: [
        { investorId: inv1.id, startupId: startup1.id, signedAt: new Date('2024-12-10') },
        { investorId: inv2.id, startupId: startup1.id, signedAt: new Date('2024-12-08') },
      ],
    })
    console.log('NDA agreements seeded.')
  }

  // ============================================================
  // 7. EVENTS
  // ============================================================
  const existingEvents = await prisma.event.count()
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        { title: 'Питч-день WayInvest #4', type: 'Питч-сессия', emoji: '🎤', description: 'Лучшие стартапы ЧР представят свои проекты перед инвесторами платформы.', dateTime: new Date('2024-12-20T14:00:00'), participants: 45 },
        { title: 'Вебинар: Как привлечь первые инвестиции', type: 'Вебинар', emoji: '💡', description: 'Практическое руководство по подготовке к инвестиционному раунду.', dateTime: new Date('2024-12-22T12:00:00'), participants: 120 },
        { title: 'Мастер-класс: Финансовая модель стартапа', type: 'Мастер-класс', emoji: '📊', description: 'Как построить правильную финансовую модель для привлечения инвестора.', dateTime: new Date('2024-12-25T15:00:00'), participants: 67 },
        { title: 'Нетворкинг для инвесторов ЧР', type: 'Сетевое мероприятие', emoji: '🤝', description: 'Закрытое мероприятие для верифицированных инвесторов платформы.', dateTime: new Date('2024-12-28T18:00:00'), participants: 22 },
      ],
    })
    console.log('Events seeded.')
  }

  console.log('Seed completed!')
  console.log('')
  console.log('=== Login credentials ===')
  console.log('Admin:    admin@wayinvest.ru / admin123')
  console.log('Startup:  alihan@techchechnya.ru / password123')
  console.log('Investor: rustam@investor.ru / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
