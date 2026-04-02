'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import {
  getAdminDashboardData,
  getVerificationQueue,
  getAdminStartups,
  getAdminInvestors,
  getAdminEvents,
  getAdminCommissions,
  getAdminTariffs,
  approveInvestor,
  rejectInvestor,
} from '@/actions/admin.actions'

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

// --- helpers -----------------------------------------------------------------

const stageLabel: Record<string, string> = {
  IDEA: 'Idea',
  PRE_SEED: 'Pre-seed',
  SEED: 'Seed',
  ROUND_A: 'Series A',
}

function fmtStage(s: string) {
  return stageLabel[s] ?? s
}

function fmtMoney(rubles: number): string {
  if (rubles >= 1_000_000) return `₽${(rubles / 1_000_000).toFixed(rubles % 1_000_000 === 0 ? 0 : 1)}М`
  if (rubles >= 1_000) return `₽${(rubles / 1_000).toFixed(rubles % 1_000 === 0 ? 0 : 1)}К`
  return `₽${rubles}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU')
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Вчера'
  return `${diffDays} дней назад`
}

// --- component ---------------------------------------------------------------

export default function AdminPage() {
  const [activePanel, setActivePanel] = useState<Panel>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { openModal, showToast } = useApp()

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [verifyData, setVerifyData] = useState<any[] | null>(null)
  const [startupsData, setStartupsData] = useState<any[]>([])
  const [investorsData, setInvestorsData] = useState<any[]>([])
  const [eventsData, setEventsData] = useState<any[]>([])
  const [commissionsData, setCommissionsData] = useState<any>(null)
  const [tariffsData, setTariffsData] = useState<any[] | null>(null)

  // Load dashboard on mount
  useEffect(() => {
    setLoading(true)
    getAdminDashboardData()
      .then(data => { setDashboardData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Load panel-specific data
  useEffect(() => {
    if (activePanel === 'verify' && !verifyData) {
      getVerificationQueue().then(setVerifyData).catch(() => {})
    } else if (activePanel === 'startups' && startupsData.length === 0) {
      getAdminStartups().then(setStartupsData).catch(() => {})
    } else if (activePanel === 'investors' && investorsData.length === 0) {
      getAdminInvestors().then(setInvestorsData).catch(() => {})
    } else if (activePanel === 'events' && eventsData.length === 0) {
      getAdminEvents().then(setEventsData).catch(() => {})
    } else if (activePanel === 'commissions' && !commissionsData) {
      getAdminCommissions().then(setCommissionsData).catch(() => {})
    } else if (activePanel === 'tariffs' && !tariffsData) {
      getAdminTariffs().then(setTariffsData).catch(() => {})
    }
  }, [activePanel])

  const handleApprove = async (id: string, name: string) => {
    try {
      const result = await approveInvestor(id)
      showToast(`${result.name} верифицирован`, '✅')
      // Refresh data
      getVerificationQueue().then(setVerifyData).catch(() => {})
      getAdminDashboardData().then(setDashboardData).catch(() => {})
      if (investorsData.length > 0) getAdminInvestors().then(setInvestorsData).catch(() => {})
    } catch {
      showToast('Ошибка при одобрении', '❌')
    }
  }

  const handleReject = async (id: string, name: string) => {
    try {
      const result = await rejectInvestor(id)
      showToast(`Заявка ${result.name} отклонена`, '❌')
      getVerificationQueue().then(setVerifyData).catch(() => {})
      getAdminDashboardData().then(setDashboardData).catch(() => {})
      if (investorsData.length > 0) getAdminInvestors().then(setInvestorsData).catch(() => {})
    } catch {
      showToast('Ошибка при отклонении', '❌')
    }
  }

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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка данных...</div>
          ) : dashboardData ? (
            <>
              <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="admin-stat">
                  <div className="admin-stat-icon">🚀</div>
                  <div className="admin-stat-info">
                    <div className="val">{dashboardData.counts.totalStartups}</div>
                    <div className="lbl">стартапов</div>
                  </div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat-icon">💼</div>
                  <div className="admin-stat-info">
                    <div className="val">{dashboardData.counts.verifiedInvestors}</div>
                    <div className="lbl">инвесторов</div>
                  </div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat-icon">⏳</div>
                  <div className="admin-stat-info">
                    <div className="val text-red">{dashboardData.counts.pendingVerifications}</div>
                    <div className="lbl">ожидают верификации</div>
                  </div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat-icon">💰</div>
                  <div className="admin-stat-info">
                    <div className="val text-gold">{fmtMoney(dashboardData.counts.totalCommissions)}</div>
                    <div className="lbl">комиссий</div>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Последние заявки на верификацию</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {dashboardData.recentVerificationRequests.length === 0 ? (
                      <div className="text-dim" style={{ padding: '12px 0' }}>Нет заявок на верификацию</div>
                    ) : (
                      dashboardData.recentVerificationRequests.map((v: any) => (
                        <div key={v.id} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div className="fw-600">{v.name}</div>
                            <div className="text-dim" style={{ fontSize: '.8rem' }}>{v.companyName || 'ИП'} — {timeAgo(v.createdAt)}</div>
                          </div>
                          <button className="btn btn-gold btn-sm" onClick={() => handleApprove(v.id, v.name)}>
                            Одобрить
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Комиссии по месяцам</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {dashboardData.monthlyCommissions.length === 0 ? (
                      <div className="text-dim">Нет данных о комиссиях</div>
                    ) : (
                      (() => {
                        const maxAmount = Math.max(...dashboardData.monthlyCommissions.map((mc: any) => mc.amount), 1)
                        return dashboardData.monthlyCommissions.map((mc: any, i: number) => (
                          <div key={i}>
                            <div className="flex-between">
                              <span>{mc.month}</span>
                              <span className="text-gold fw-600">{fmtMoney(mc.amount)}</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${Math.round((mc.amount / maxAmount) * 100)}%` }} />
                            </div>
                          </div>
                        ))
                      })()
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Не удалось загрузить данные</div>
          )}
        </div>

        {/* Verify Panel */}
        <div className={`dash-panel ${activePanel === 'verify' ? 'active' : ''}`}>
          {!verifyData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка очереди верификации...</div>
          ) : (
            <>
              <div className="verify-banner">
                <div className="icon">⚠️</div>
                <p><strong>{verifyData.length} заявок ожидают проверки</strong></p>
              </div>

              <div className="card">
                {verifyData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>Нет заявок на верификацию</div>
                ) : (
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
                      {verifyData.map((item: any) => (
                        <tr key={item.id}>
                          <td className="fw-600">{item.name}</td>
                          <td>{item.companyName || 'ИП'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{item.ogrn || '—'}</td>
                          <td>{timeAgo(item.createdAt)}</td>
                          <td>
                            <div className="flex-gap">
                              <button className="btn btn-gold btn-sm" onClick={() => handleApprove(item.id, item.name)}>Одобрить</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleReject(item.id, item.name)}>Отклонить</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
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

          {startupsData.length === 0 && activePanel === 'startups' ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка стартапов...</div>
          ) : (
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
                  {startupsData
                    .filter((s: any) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s: any) => (
                      <tr key={s.id}>
                        <td className="fw-600">{s.name}</td>
                        <td>
                          <span className={`badge ${s.sector.includes('IT') ? 'badge-blue' : s.sector.includes('Агро') ? 'badge-gold' : s.sector.includes('Фин') ? 'badge-green' : 'badge-blue'}`}>
                            {s.sector.split(' / ')[0]}
                          </span>
                        </td>
                        <td>{s.tariffName}</td>
                        <td>
                          <span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>
                            {s.isActive ? 'Активен' : 'На модерации'}
                          </span>
                        </td>
                        <td>
                          {s.isActive ? (
                            <button className="btn btn-ghost btn-sm">Подробнее</button>
                          ) : (
                            <button className="btn btn-gold btn-sm" onClick={() => showToast('Стартап одобрен', '✅')}>Одобрить</button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Investors Panel */}
        <div className={`dash-panel ${activePanel === 'investors' ? 'active' : ''}`}>
          {investorsData.length === 0 && activePanel === 'investors' ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка инвесторов...</div>
          ) : (
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
                  {investorsData.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="fw-600">{inv.name}</td>
                      <td>{inv.companyName || 'ИП'}</td>
                      <td>{inv.dealCount} ({fmtMoney(inv.totalInvested)})</td>
                      <td>
                        <span className={`badge ${inv.verificationStatus === 'APPROVED' ? 'badge-green' : inv.verificationStatus === 'PENDING' ? 'badge-gold' : 'badge-red'}`}>
                          {inv.verificationStatus === 'APPROVED' ? 'Верифицирован' : inv.verificationStatus === 'PENDING' ? 'Ожидает' : 'Отклонён'}
                        </span>
                      </td>
                      <td>
                        {inv.verificationStatus === 'APPROVED' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => showToast('Инвестор приостановлен', '⚠️')}>Приостановить</button>
                        ) : inv.verificationStatus === 'PENDING' ? (
                          <div className="flex-gap">
                            <button className="btn btn-gold btn-sm" onClick={() => handleApprove(inv.id, inv.name)}>Одобрить</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(inv.id, inv.name)}>Отклонить</button>
                          </div>
                        ) : (
                          <button className="btn btn-gold btn-sm" onClick={() => handleApprove(inv.id, inv.name)}>Восстановить</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Events Panel */}
        <div className={`dash-panel ${activePanel === 'events' ? 'active' : ''}`}>
          <div style={{ marginBottom: 24 }}>
            <button className="btn btn-gold" onClick={() => openModal('addEvent')}>
              ➕ Создать мероприятие
            </button>
          </div>

          {eventsData.length === 0 && activePanel === 'events' ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка мероприятий...</div>
          ) : (
            <div className="grid-2">
              {eventsData.map((event: any, i: number) => (
                <div className="event-card" key={i}>
                  <div className="event-banner">{event.emoji}</div>
                  <div className="event-body">
                    <div className="event-date">📅 {fmtDateTime(event.dateTime)} в {fmtTime(event.dateTime)}</div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-desc">{event.description}</div>
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
          )}
        </div>

        {/* Commissions Panel */}
        <div className={`dash-panel ${activePanel === 'commissions' ? 'active' : ''}`}>
          {!commissionsData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка данных о комиссиях...</div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Настройки комиссии</h3>
                <div className="commission-notice">
                  Текущая ставка: <strong>{Math.round(commissionsData.settings.commissionRate * 100)}%</strong> от суммы каждой сделки. Ставка фиксирована в пользовательском соглашении. Изменение ставки требует уведомления пользователей за <strong>30 дней</strong>.
                </div>
                <div className="grid-3" style={{ marginTop: 16 }}>
                  <div className="stat-box">
                    <div className="num">{Math.round(commissionsData.settings.commissionRate * 100)}%</div>
                    <div className="lbl">текущая ставка</div>
                  </div>
                  <div className="stat-box">
                    <div className="num">{fmtMoney(commissionsData.transactions.reduce((s: number, t: any) => s + t.commissionAmount, 0))}</div>
                    <div className="lbl">всего собрано</div>
                  </div>
                  <div className="stat-box">
                    <div className="num">{commissionsData.transactions.length}</div>
                    <div className="lbl">транзакций</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>История транзакций</h3>
                {commissionsData.transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>Нет транзакций</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Сделка</th>
                        <th>Инвестор</th>
                        <th>Сумма</th>
                        <th>Комиссия {Math.round(commissionsData.settings.commissionRate * 100)}%</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionsData.transactions.map((t: any) => (
                        <tr key={t.id}>
                          <td className="fw-600">{t.startupName}</td>
                          <td>{t.investorName}</td>
                          <td>{fmtMoney(t.dealAmount)}</td>
                          <td className="text-gold fw-600">{fmtMoney(t.commissionAmount)}</td>
                          <td>{fmtDate(t.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tariffs Panel */}
        <div className={`dash-panel ${activePanel === 'tariffs' ? 'active' : ''}`}>
          {!tariffsData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка тарифов...</div>
          ) : (
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
                    {tariffsData.map((t: any) => (
                      <tr key={t.id}>
                        <td className="fw-600">{t.name}</td>
                        <td>{t.priceMonthly === 0 ? '0 ₽' : `${t.priceMonthly.toLocaleString('ru-RU')} ₽`}</td>
                        <td>{t.subscriberCount}</td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => showToast('Редактирование тарифа', '✏️')}>Изменить</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Доход от тарифов</h3>

                {(() => {
                  const paidTariffs = tariffsData.filter((t: any) => t.priceMonthly > 0 && t.subscriberCount > 0)
                  const maxRevenue = Math.max(...paidTariffs.map((t: any) => t.monthlyRevenue), 1)
                  const totalMonthly = paidTariffs.reduce((s: number, t: any) => s + t.monthlyRevenue, 0)

                  return (
                    <>
                      {paidTariffs.map((t: any, i: number) => (
                        <div key={i} style={{ marginBottom: 20 }}>
                          <div className="flex-between">
                            <span className="fw-600">{t.name} <span className="text-dim" style={{ fontWeight: 400 }}>&times;{t.subscriberCount}</span></span>
                            <span className="text-gold fw-600">₽{t.monthlyRevenue.toLocaleString('ru-RU')}/мес</span>
                          </div>
                          <div className="progress-bar" style={{ marginTop: 8 }}>
                            <div className="progress-fill" style={{ width: `${Math.round((t.monthlyRevenue / maxRevenue) * 100)}%` }} />
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        <div className="flex-between">
                          <span className="fw-600">Итого</span>
                          <span className="text-gold fw-600" style={{ fontSize: '1.2rem' }}>₽{totalMonthly.toLocaleString('ru-RU')}/мес</span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
