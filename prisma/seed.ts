import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Tariffs
  const tariffs = [
    { name: 'Базовый', slug: 'basic', priceMonthly: BigInt(0), features: ['Профиль стартапа', 'Базовое описание проекта', 'Доступ к каталогу инвесторов', 'Получение откликов'], isFeatured: false, sortOrder: 1 },
    { name: 'Стартовый', slug: 'starter', priceMonthly: BigInt(490000), features: ['Всё из Базового', 'Приоритет в поиске', 'Расширенная аналитика просмотров', 'AI-подбор инвесторов', 'Статистика интереса'], isFeatured: false, sortOrder: 2 },
    { name: 'Премиум', slug: 'premium', priceMonthly: BigInt(1290000), features: ['Всё из Стартового', 'Индивидуальная консультация', 'Помощь в оформлении документов', 'NDA + водяные знаки', 'Ограниченный доступ к файлам', 'Высший приоритет AI-подбора'], isFeatured: true, sortOrder: 3 },
    { name: 'Элит', slug: 'elite', priceMonthly: BigInt(2990000), features: ['Всё из Премиум', 'Персональный менеджер', 'Участие в закрытых питч-сессиях', 'Featured-размещение на главной', 'Прямой выход на топ-инвесторов', 'Юридическое сопровождение сделки'], isFeatured: false, sortOrder: 4 },
  ]

  for (const t of tariffs) {
    await prisma.tariff.upsert({
      where: { slug: t.slug },
      update: { name: t.name, priceMonthly: t.priceMonthly, features: t.features, isFeatured: t.isFeatured, sortOrder: t.sortOrder },
      create: t,
    })
  }
  console.log('Tariffs seeded.')

  // 2. Admin user
  const adminEmail = 'admin@wayinvest.ru'
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!adminExists) {
    const passwordHash = await hash('admin123', 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        fullName: 'Администратор',
      },
    })
    console.log('Admin user created: admin@wayinvest.ru / admin123')
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
