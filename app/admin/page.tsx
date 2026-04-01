'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { events } from '@/lib/data'

type Panel = 'dashboard' | 'verify' | 'startups' | 'investors' | 'events' | 'commissions' | 'tariffs'

const panelTitles: Record<Panel, string> = {
  dashboard: 'Обзор платформы',
  verify: 'Верификация инвесторов',
  startups: 'Управление стартапами',
  investors: 'Управление инвесторами',
  events: 'Мероприятия',
  commissions: 'Комиссии',
  tariffs: 'Тарифы',
}

export default function AdminPage() {
  const [activePanel, setActivePanel] = useState<Panel>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { openModal, showToast } = useApp()

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => router.push('/')}>
          Way<span>Invest</span>
        </div>

        <div style={{ padding: '16px 24px' }}>
          <span className="badge badge-gold">⚙️ Панель администратора</span>
        </div>

        <div className="sidebar-section">Управление</div>
        <div
          className={`sidebar-item ${activePanel === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePanel('dashboard')}
        >
          <span className="icon">📊</span> Обзор
        </div>
        <div
          className={`sidebar-item ${activePanel === 'verify' ? 'active' : ''}`}
          onClick={() => setActivePanel('verify')}
        >
          <span className="icon">✅</span> Верификация
        </div>
        <div
          className={`sidebar-item ${activePanel === 'startups' ? 'active' : ''}`}
          onClick={() => setActivePanel('startups')}
        >
          <span className="icon">🚀</span> Стартапы
        </div>
        <div
          className={`sidebar-item ${activePanel === 'investors' ? 'active' : ''}`}
          onClick={() => setActivePanel('investors')}
        >
          <span className="icon">💼</span> Инвесторы
        </div>

        <div className="sidebar-section">Система</div>
        <div
          className={`sidebar-item ${activePanel === 'events' ? 'active' : ''}`}
          onClick={() => setActivePanel('events')}
        >
          <span className="icon">📅</span> Мероприятия
        </div>
        <div
          className={`sidebar-item ${activePanel === 'commissions' ? 'active' : ''}`}
          onClick={() => setActivePanel('commissions')}
        >
          <span className="icon">💰</span> Комиссии
        </div>
        <div
          className={`sidebar-item ${activePanel === 'tariffs' ? 'active' : ''}`}
          onClick={() => setActivePanel('tariffs')}
        >
          <span className="icon">📦</span> Тарифы
        </div>

        <div className="sidebar-section" />
        <div
          className="sidebar-item"
          onClick={() => router.push('/')}
        >
          <span className="icon">🚪</span> Выйти
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <div className="dash-header">
          <h1>{panelTitles[activePanel]}</h1>
          <div className="dash-user">
            <button className="notif-btn">
              🔔
              <div className="notif-dot" />
            </button>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #E74C3C, #C0392B)' }}>АД</div>
            <span>Администратор</span>
          </div>
        </div>

        {/* Dashboard Panel */}
        <div className={`dash-panel ${activePanel === 'dashboard' ? 'active' : ''}`}>
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <div className="admin-stat">
              <div className="admin-stat-icon">🚀</div>
              <div className="admin-stat-info">
                <div className="val">42</div>
                <div className="lbl">стартапов</div>
              </div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-icon">💼</div>
              <div className="admin-stat-info">
                <div className="val">18</div>
                <div className="lbl">инвесторов</div>
              </div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-icon">⏳</div>
              <div className="admin-stat-info">
                <div className="val text-red">5</div>
                <div className="lbl">ожидают верификации</div>
              </div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-icon">💰</div>
              <div className="admin-stat-info">
                <div className="val text-gold">₽22.4М</div>
                <div className="lbl">комиссий</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Последние заявки на верификацию</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="fw-600">Дауд Мусаев</div>
                    <div className="text-dim" style={{ fontSize: '.8rem' }}>ИП — Сегодня</div>
                  </div>
                  <button className="btn btn-gold btn-sm" onClick={() => showToast('Заявка одобрена', '✅')}>
                    Одобрить
                  </button>
                </div>
                <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="fw-600">Аиша Алиева</div>
                    <div className="text-dim" style={{ fontSize: '.8rem' }}>ИП — Вчера</div>
                  </div>
                  <button className="btn btn-gold btn-sm" onClick={() => showToast('Заявка одобрена', '✅')}>
                    Одобрить
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Комиссии по месяцам</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="flex-between">
                  <span>Дек</span>
                  <span className="text-gold fw-600">₽4.8М</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '38%' }} />
                </div>
                <div className="flex-between">
                  <span>Ноя</span>
                  <span className="text-gold fw-600">₽6.2М</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '50%' }} />
                </div>
                <div className="flex-between">
                  <span>Окт</span>
                  <span className="text-gold fw-600">₽11.4М</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '90%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verify Panel */}
        <div className={`dash-panel ${activePanel === 'verify' ? 'active' : ''}`}>
          <div className="verify-banner">
            <div className="icon">⚠️</div>
            <p><strong>5 заявок ожидают проверки</strong></p>
          </div>

          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Документ</th>
                  <th>ОГРНИП</th>
                  <th>Подано</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-600">Дауд Мусаев</td>
                  <td>ИП</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>321619600026001</td>
                  <td>Сегодня</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-gold btn-sm" onClick={() => showToast('Дауд Мусаев верифицирован', '✅')}>Одобрить</button>
                      <button className="btn btn-danger btn-sm" onClick={() => showToast('Заявка отклонена', '❌')}>Отклонить</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="fw-600">Аиша Алиева</td>
                  <td>ИП</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>321619600026002</td>
                  <td>Вчера</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-gold btn-sm" onClick={() => showToast('Аиша Алиева верифицирована', '✅')}>Одобрить</button>
                      <button className="btn btn-danger btn-sm" onClick={() => showToast('Заявка отклонена', '❌')}>Отклонить</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="fw-600">Беслан Хасанов</td>
                  <td>ООО &laquo;ГрозИнвест&raquo;</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>7205105008</td>
                  <td>3 дня назад</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-gold btn-sm" onClick={() => showToast('Беслан Хасанов верифицирован', '✅')}>Одобрить</button>
                      <button className="btn btn-danger btn-sm" onClick={() => showToast('Заявка отклонена', '❌')}>Отклонить</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Startups Panel */}
        <div className={`dash-panel ${activePanel === 'startups' ? 'active' : ''}`}>
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="Поиск стартапов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-outline btn-sm">🔍 Найти</button>
          </div>

          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Стартап</th>
                  <th>Отрасль</th>
                  <th>Тариф</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-600">ТехЧечня</td>
                  <td><span className="badge badge-blue">IT</span></td>
                  <td>Стартовый</td>
                  <td><span className="badge badge-green">Активен</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm">Подробнее</button>
                  </td>
                </tr>
                <tr>
                  <td className="fw-600">ГрозАгро</td>
                  <td><span className="badge badge-gold">Агротех</span></td>
                  <td>Премиум</td>
                  <td><span className="badge badge-green">Активен</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm">Подробнее</button>
                  </td>
                </tr>
                <tr>
                  <td className="fw-600">ЧечняФинтех</td>
                  <td><span className="badge badge-green">Финтех</span></td>
                  <td>Базовый</td>
                  <td><span className="badge badge-red">На модерации</span></td>
                  <td>
                    <button className="btn btn-gold btn-sm" onClick={() => showToast('Стартап одобрен', '✅')}>Одобрить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Investors Panel */}
        <div className={`dash-panel ${activePanel === 'investors' ? 'active' : ''}`}>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Инвестор</th>
                  <th>Документ</th>
                  <th>Сделки</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-600">Рустам Бекмурзаев</td>
                  <td>ИП</td>
                  <td>2 (₽42М)</td>
                  <td><span className="badge badge-green">Верифицирован</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => showToast('Инвестор приостановлен', '⚠️')}>Приостановить</button>
                  </td>
                </tr>
                <tr>
                  <td className="fw-600">Магомед Ахматов</td>
                  <td>ИП</td>
                  <td>1 (₽8М)</td>
                  <td><span className="badge badge-green">Верифицирован</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => showToast('Инвестор приостановлен', '⚠️')}>Приостановить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Events Panel */}
        <div className={`dash-panel ${activePanel === 'events' ? 'active' : ''}`}>
          <div style={{ marginBottom: 24 }}>
            <button className="btn btn-gold" onClick={() => openModal('addEvent')}>
              ➕ Создать мероприятие
            </button>
          </div>

          <div className="grid-2">
            {events.map((event, i) => (
              <div className="event-card" key={i}>
                <div className="event-banner">{event.emoji}</div>
                <div className="event-body">
                  <div className="event-date">📅 {event.date} в {event.time}</div>
                  <div className="event-title">{event.title}</div>
                  <div className="event-desc">{event.desc}</div>
                  <div className="event-footer">
                    <span className="event-participants">👥 {event.participants} участников</span>
                    <div className="flex-gap">
                      <button className="btn btn-outline btn-sm" onClick={() => showToast('Редактирование мероприятия', '✏️')}>Изменить</button>
                      <button className="btn btn-danger btn-sm" onClick={() => showToast('Мероприятие удалено', '🗑️')}>Удалить</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commissions Panel */}
        <div className={`dash-panel ${activePanel === 'commissions' ? 'active' : ''}`}>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Настройки комиссии</h3>
            <div className="commission-notice">
              Текущая ставка: <strong>8%</strong> от суммы каждой сделки. Ставка фиксирована в пользовательском соглашении. Изменение ставки требует уведомления пользователей за <strong>30 дней</strong>.
            </div>
            <div className="grid-3" style={{ marginTop: 16 }}>
              <div className="stat-box">
                <div className="num">8%</div>
                <div className="lbl">текущая ставка</div>
              </div>
              <div className="stat-box">
                <div className="num">₽22.4М</div>
                <div className="lbl">всего собрано</div>
              </div>
              <div className="stat-box">
                <div className="num">6</div>
                <div className="lbl">транзакций</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>История транзакций</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Сделка</th>
                  <th>Инвестор</th>
                  <th>Сумма</th>
                  <th>Комиссия 8%</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-600">ТехЧечня</td>
                  <td>Бекмурзаев</td>
                  <td>₽15М</td>
                  <td className="text-gold fw-600">₽1.2М</td>
                  <td>01.11.2024</td>
                </tr>
                <tr>
                  <td className="fw-600">ГрозАгро</td>
                  <td>Бекмурзаев</td>
                  <td>₽27М</td>
                  <td className="text-gold fw-600">₽2.16М</td>
                  <td>15.09.2024</td>
                </tr>
                <tr>
                  <td className="fw-600">ЧечняФинтех</td>
                  <td>Ахматов</td>
                  <td>₽8М</td>
                  <td className="text-gold fw-600">₽640К</td>
                  <td>03.08.2024</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tariffs Panel */}
        <div className={`dash-panel ${activePanel === 'tariffs' ? 'active' : ''}`}>
          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Управление тарифами</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Тариф</th>
                    <th>Цена/мес</th>
                    <th>Подписчики</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-600">Базовый</td>
                    <td>0 ₽</td>
                    <td>28</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => showToast('Редактирование тарифа', '✏️')}>Изменить</button></td>
                  </tr>
                  <tr>
                    <td className="fw-600">Стартовый</td>
                    <td>4 900 ₽</td>
                    <td>9</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => showToast('Редактирование тарифа', '✏️')}>Изменить</button></td>
                  </tr>
                  <tr>
                    <td className="fw-600">Премиум</td>
                    <td>12 900 ₽</td>
                    <td>4</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => showToast('Редактирование тарифа', '✏️')}>Изменить</button></td>
                  </tr>
                  <tr>
                    <td className="fw-600">Элит</td>
                    <td>29 900 ₽</td>
                    <td>1</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => showToast('Редактирование тарифа', '✏️')}>Изменить</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Доход от тарифов</h3>

              <div style={{ marginBottom: 20 }}>
                <div className="flex-between">
                  <span className="fw-600">Стартовый <span className="text-dim" style={{ fontWeight: 400 }}>&times;9</span></span>
                  <span className="text-gold fw-600">₽44 100/мес</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: '30%' }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="flex-between">
                  <span className="fw-600">Премиум <span className="text-dim" style={{ fontWeight: 400 }}>&times;4</span></span>
                  <span className="text-gold fw-600">₽51 600/мес</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: '35%' }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="flex-between">
                  <span className="fw-600">Элит <span className="text-dim" style={{ fontWeight: 400 }}>&times;1</span></span>
                  <span className="text-gold fw-600">₽29 900/мес</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: '20%' }} />
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div className="flex-between">
                  <span className="fw-600">Итого</span>
                  <span className="text-gold fw-600" style={{ fontSize: '1.2rem' }}>₽125 600/мес</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
