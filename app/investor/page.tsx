'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import {
  getInvestorDashboardData,
  getInvestorProfile,
  getStartupCatalog,
  getInvestorDeals,
  getInvestorEvents,
  getInvestorRequisites,
  saveInvestorRequisites,
} from '@/actions/investor.actions'
import { addChatParticipant, getChatList, getChatMessages, sendMessage, startChat } from '@/actions/chat.actions'

type Panel = 'dashboard' | 'profile' | 'bankCard' | 'aiMatch' | 'catalog' | 'chat' | 'events' | 'deals'

const panelTitles: Record<Panel, string> = {
  dashboard: 'Дашборд',
  profile: 'Мой профиль',
  bankCard: 'Банковская карта',
  aiMatch: 'AI-подбор стартапов',
  catalog: 'Каталог стартапов',
  chat: 'Чаты',
  events: 'Мероприятия',
  deals: 'Мои сделки',
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

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function sectorEmoji(sector: string): string {
  if (sector.includes('IT') || sector.includes('Маркетплейс')) return '🚀'
  if (sector.includes('Агро')) return '🌾'
  if (sector.includes('Фин')) return '💳'
  return '🚛'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2)
}

function formatPhoneRu(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11)
  const d = digits.startsWith('7') ? digits.slice(1) : digits
  let out = '+7'
  if (d.length > 0) out += ` (${d.slice(0, 3)}`
  if (d.length >= 3) out += ')'
  if (d.length > 3) out += ` ${d.slice(3, 6)}`
  if (d.length > 6) out += `-${d.slice(6, 8)}`
  if (d.length > 8) out += `-${d.slice(8, 10)}`
  return out
}

function formatCardMasked(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

// --- component ---------------------------------------------------------------

interface ChatMessage {
  id?: string
  text: string
  mine: boolean
  time: string
}

interface ChatItem {
  chatId: string
  partnerName: string
  chatName: string | null
  isGroup: boolean
  lastMessage: { content: string; createdAt: string | null; isMine: boolean } | null
}

export default function InvestorPage() {
  const [activePanel, setActivePanel] = useState<Panel>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Все')
  const [loading, setLoading] = useState(true)

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [catalogData, setCatalogData] = useState<any[]>([])
  const [dealsData, setDealsData] = useState<any[] | null>(null)
  const [eventsData, setEventsData] = useState<any[]>([])

  // Chat states
  const [chatList, setChatList] = useState<ChatItem[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatParticipantEmail, setChatParticipantEmail] = useState('')
  const [chatParticipantBusy, setChatParticipantBusy] = useState(false)
  const [cardRequisites, setCardRequisites] = useState({
    phone: '',
    bankName: '',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    updatedAt: null as string | null,
  })
  const [cardRequisitesLoaded, setCardRequisitesLoaded] = useState(false)
  const [cardRequisitesBusy, setCardRequisitesBusy] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { openModal, showToast } = useApp()

  const filters = ['Все', 'IT', 'Агротех', 'Финтех', 'Pre-seed', 'Seed']

  // Start or open existing chat with a startup user
  async function handleStartChat(partnerUserId: string) {
    try {
      const chatId = await startChat(partnerUserId)
      setActivePanel('chat')
      // Load chats then select the new one
      const chats = await getChatList()
      setChatList(chats)
      setActiveChatId(chatId)
      const msgs = await getChatMessages(chatId)
      setChatMessages(msgs.map((m: any) => ({ id: m.id, text: m.content, mine: m.isMine, time: fmtTime(m.createdAt) })))
      showToast('Чат открыт', '💬')
    } catch {
      showToast('Не удалось создать чат', '❌')
    }
  }

  // Load dashboard data on mount
  useEffect(() => {
    setLoading(true)
    getInvestorDashboardData()
      .then(data => { setDashboardData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Load panel-specific data when panel changes
  useEffect(() => {
    if (activePanel === 'profile' && !profileData) {
      getInvestorProfile().then(setProfileData).catch(() => {})
    } else if ((activePanel === 'catalog' || activePanel === 'aiMatch') && catalogData.length === 0) {
      getStartupCatalog().then(setCatalogData).catch(() => {})
    } else if (activePanel === 'deals' && !dealsData) {
      getInvestorDeals().then(setDealsData).catch(() => {})
    } else if (activePanel === 'events' && eventsData.length === 0) {
      getInvestorEvents().then(setEventsData).catch(() => {})
    } else if (activePanel === 'chat' && chatList.length === 0) {
      getChatList().then(list => {
        setChatList(list as any)
        if (list.length > 0) setActiveChatId((list[0] as any).chatId)
      }).catch(() => {})
    } else if (activePanel === 'bankCard' && !cardRequisitesLoaded) {
      getInvestorRequisites().then((data) => {
        setCardRequisites(data)
        setCardRequisitesLoaded(true)
      }).catch(() => {})
    }
  }, [activePanel])

  // Load chat messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      setChatLoading(true)
      getChatMessages(activeChatId).then(msgs => {
        setChatMessages(msgs.map((m: any) => ({ id: m.id, text: m.content, mine: m.isMine, time: fmtTime(m.createdAt) })))
        setChatLoading(false)
      }).catch(() => setChatLoading(false))
    }
  }, [activeChatId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMsg = async () => {
    if (!chatInput.trim() || !activeChatId) return
    const text = chatInput
    setChatInput('')
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    setChatMessages(prev => [...prev, { text, mine: true, time }])

    try {
      await sendMessage(activeChatId, text)
      getChatList().then(l => setChatList(l as any)).catch(() => {})
    } catch { /* ignore */ }
  }

  const filteredCatalog = catalogData.filter((s: any) => {
    if (activeFilter === 'Все') return true
    return s.sector.includes(activeFilter) || fmtStage(s.stage) === activeFilter
  })

  const activeChat = chatList.find(c => c.chatId === activeChatId)
  const activeChatName = activeChat ? (activeChat.chatName || activeChat.partnerName) : ''
  const cardNumberPreview = cardRequisites.cardNumber || '0000 0000 0000 0000'
  const cardHolderPreview = cardRequisites.cardHolder || 'IVAN IVANOV'
  const cardExpiryPreview = cardRequisites.cardExpiry || 'MM/YY'
  const cardBankPreview = cardRequisites.bankName || 'Ваш банк'

  const handleAddChatParticipant = async () => {
    if (!activeChatId || !chatParticipantEmail.trim()) return
    setChatParticipantBusy(true)
    try {
      const res = await addChatParticipant(activeChatId, chatParticipantEmail.trim())
      setChatParticipantEmail('')
      const list = await getChatList()
      setChatList(list as any)
      const msgs = await getChatMessages(activeChatId)
      setChatMessages(msgs.map((m: any) => ({ id: m.id, text: m.content, mine: m.isMine, time: fmtTime(m.createdAt) })))
      showToast(res.message || 'Участник добавлен', '👥')
    } catch {
      showToast('Не удалось добавить участника', '❌')
    } finally {
      setChatParticipantBusy(false)
    }
  }

  const handleSaveCardRequisites = async () => {
    setCardRequisitesBusy(true)
    try {
      await saveInvestorRequisites({
        phone: cardRequisites.phone,
        bankName: cardRequisites.bankName,
        cardNumber: cardRequisites.cardNumber,
        cardHolder: cardRequisites.cardHolder,
        cardExpiry: cardRequisites.cardExpiry,
      })
      setCardRequisites((prev) => ({ ...prev, updatedAt: new Date().toISOString() }))
      showToast('Реквизиты карты сохранены', '✅')
    } catch {
      showToast('Не удалось сохранить реквизиты', '❌')
    } finally {
      setCardRequisitesBusy(false)
    }
  }

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      {sidebarOpen && <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo" onClick={() => router.push('/')}>
          Lam<span>Invest</span>
        </div>

        <div className="sidebar-section">Основное</div>
        <div
          className={`sidebar-item ${activePanel === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActivePanel('dashboard'); setSidebarOpen(false) }}
        >
          <span className="icon">📊</span> Дашборд
        </div>
        <div
          className={`sidebar-item ${activePanel === 'profile' ? 'active' : ''}`}
          onClick={() => { setActivePanel('profile'); setSidebarOpen(false) }}
        >
          <span className="icon">👤</span> Мой профиль
        </div>
        <div
          className={`sidebar-item ${activePanel === 'bankCard' ? 'active' : ''}`}
          onClick={() => { setActivePanel('bankCard'); setSidebarOpen(false) }}
        >
          <span className="icon">💳</span> Банковская карта
        </div>
        <div className="sidebar-section">Стартапы</div>
        <div
          className={`sidebar-item ${activePanel === 'aiMatch' ? 'active' : ''}`}
          onClick={() => { setActivePanel('aiMatch'); setSidebarOpen(false) }}
        >
          <span className="icon">🤖</span> AI-подбор
        </div>
        <div
          className={`sidebar-item ${activePanel === 'catalog' ? 'active' : ''}`}
          onClick={() => { setActivePanel('catalog'); setSidebarOpen(false) }}
        >
          <span className="icon">📋</span> Каталог стартапов
        </div>

        <div className="sidebar-section">Коммуникации</div>
        <div
          className={`sidebar-item ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => { setActivePanel('chat'); setSidebarOpen(false) }}
        >
          <span className="icon">💬</span> Чаты
        </div>
        <div
          className={`sidebar-item ${activePanel === 'events' ? 'active' : ''}`}
          onClick={() => { setActivePanel('events'); setSidebarOpen(false) }}
        >
          <span className="icon">📅</span> Мероприятия
        </div>

        <div className="sidebar-section">Сделки</div>
        <div
          className={`sidebar-item ${activePanel === 'deals' ? 'active' : ''}`}
          onClick={() => { setActivePanel('deals'); setSidebarOpen(false) }}
        >
          <span className="icon">🤝</span> Мои сделки
        </div>

        <div className="sidebar-section" />
        <div className="sidebar-item" onClick={() => { router.push('/'); setSidebarOpen(false) }}>
          <span className="icon">🚪</span> Выйти
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <div className="dash-header">
          <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{marginRight:12}}>☰</button>
          <h1>{panelTitles[activePanel]}</h1>
          <div className="dash-user">
            <button className="notif-btn">
              🔔
              <div className="notif-dot" />
            </button>
            <div className="avatar">{profileData ? initials(profileData.name) : 'РБ'}</div>
            <span>{profileData ? profileData.name.split(' ')[0] + ' ' + (profileData.name.split(' ')[1]?.[0] ?? '') + '.' : 'Загрузка...'}</span>
          </div>
        </div>

        {/* Dashboard Panel */}
        <div className={`dash-panel ${activePanel === 'dashboard' ? 'active' : ''}`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка данных...</div>
          ) : dashboardData ? (
            <>
              <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats.startupsViewed}</div>
                  <div className="lbl">просмотрено</div>
                </div>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats.activeNegotiations}</div>
                  <div className="lbl">переговоров</div>
                </div>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats.completedDeals}</div>
                  <div className="lbl">сделки</div>
                </div>
                <div className="stat-box">
                  <div className="num">{fmtMoney(dashboardData.stats.totalInvested)}</div>
                  <div className="lbl">инвестировано</div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="flex-between" style={{ marginBottom: 16 }}>
                    <h3>AI-рекомендации</h3>
                    <span className="text-dim" style={{ fontSize: '.82rem', cursor: 'pointer' }} onClick={() => setActivePanel('aiMatch')}>Все →</span>
                  </div>
                  {dashboardData.recommendations.slice(0, 2).map((s: any, i: number) => (
                    <div className="ai-match-card" key={i} onClick={() => openModal('startupDetail')}>
                      <div className="match-score" style={{ background: `conic-gradient(var(--gold) ${s.matchScore}%, var(--dark3) 0)` }}>
                        <span>{s.matchScore}%</span>
                      </div>
                      <div className="match-info">
                        <h4>{sectorEmoji(s.sector)} {s.name}</h4>
                        <p>{s.sector} · {fmtStage(s.stage)} · Нужно {fmtMoney(s.investmentNeeded)}</p>
                        <div className="match-tags">
                          <span className="sc-tag">{s.sector.split(' / ')[0]}</span>
                          <span className="sc-tag">{fmtStage(s.stage)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>💰 Комиссия платформы</h3>
                  <div className="commission-notice">
                    Ставка комиссии: <strong>{Math.round(dashboardData.commission.rate * 100)}%</strong> от суммы каждой сделки. Комиссия списывается автоматически при проведении сделки через платформу.
                  </div>
                  <div className="stat-box" style={{ marginTop: 16 }}>
                    <div className="num">{Math.round(dashboardData.commission.rate * 100)}%</div>
                    <div className="lbl">фиксированная ставка</div>
                  </div>
                  <div style={{ background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.2)', borderRadius: 8, padding: '12px 16px', marginTop: 16, fontSize: '.84rem', color: 'var(--text-dim)' }}>
                    ⚠️ <strong style={{ color: 'var(--red)' }}>Важно:</strong> Все сделки должны проводиться исключительно через платформу. Проведение сделок вне платформы является нарушением пользовательского соглашения.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Не удалось загрузить данные</div>
          )}
        </div>

        {/* Profile Panel */}
        <div className={`dash-panel ${activePanel === 'profile' ? 'active' : ''}`}>
          {!profileData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка профиля...</div>
          ) : (
            <>
              <div className="profile-header">
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #3498DB, #2980B9)' }}>{initials(profileData.name)}</div>
                <div className="profile-info">
                  <h2>{profileData.name}</h2>
                  <p>Инвестор · {profileData.sectorFocus.length > 0 ? profileData.sectorFocus.join(', ') : 'IT, Ритейл'} · Чек: {profileData.checkMin && profileData.checkMax ? `₽${fmtMoney(profileData.checkMin).replace('₽', '')}–${fmtMoney(profileData.checkMax).replace('₽', '')}` : '₽5–20М'}</p>
                  <div className="profile-stats">
                    <div className="pstat">
                      <div className="n">{profileData.completedDeals}</div>
                      <div className="l">сделки</div>
                    </div>
                    <div className="pstat">
                      <div className="n">{fmtMoney(profileData.totalInvested)}</div>
                      <div className="l">инвестировано</div>
                    </div>
                    <div className="pstat">
                      <div className="n">{profileData.rating ?? 0}⭐</div>
                      <div className="l">рейтинг</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 style={{ marginBottom: 20 }}>Инвестиционный профиль</h3>
                  <div className="form-group">
                    <label>Отраслевой фокус</label>
                    <select defaultValue={profileData.sectorFocus.length > 0 ? profileData.sectorFocus.join(', ') : 'IT, Ритейл'}>
                      <option>IT, Ритейл</option>
                      <option>Финтех</option>
                      <option>Агротех</option>
                      <option>Логистика</option>
                      <option>Экология</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Размер чека</label>
                    <select defaultValue={profileData.checkMin && profileData.checkMax ? `₽${fmtMoney(profileData.checkMin).replace('₽', '')}–${fmtMoney(profileData.checkMax).replace('₽', '')}` : '₽5–20М'}>
                      <option>₽1–5М</option>
                      <option>₽5–20М</option>
                      <option>₽20–50М</option>
                      <option>₽50М+</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Предпочтительная стадия</label>
                    <select defaultValue={profileData.preferredStages.length > 0 ? profileData.preferredStages.map(fmtStage).join(', ') : 'Pre-seed, Seed'}>
                      <option>Pre-seed</option>
                      <option>Seed</option>
                      <option>Pre-seed, Seed</option>
                      <option>Series A</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Регион</label>
                    <select defaultValue={profileData.region || 'Чеченская Республика'}>
                      <option>Чеченская Республика</option>
                      <option>СКФО</option>
                      <option>Вся Россия</option>
                    </select>
                  </div>
                  <button className="btn btn-gold" onClick={() => showToast('Профиль обновлён', '✅')}>Сохранить изменения</button>
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: 20 }}>Отзывы от стартапов</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {profileData.reviews.length > 0 ? (
                      profileData.reviews.map((review: any, i: number) => (
                        <div key={i} style={{ padding: '16px', background: 'var(--dark3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                          <div className="flex-between" style={{ marginBottom: 8 }}>
                            <span className="fw-600">{review.author}</span>
                            <span style={{ color: 'var(--gold)', fontSize: '.85rem' }}>{'★'.repeat(review.rating)}</span>
                          </div>
                          <p className="text-dim" style={{ fontSize: '.85rem', lineHeight: 1.6 }}>
                            {review.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-dim" style={{ fontSize: '.85rem' }}>Пока нет отзывов</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bank Card Panel */}
        <div className={`dash-panel ${activePanel === 'bankCard' ? 'active' : ''}`}>
          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>💳 Реквизиты банковской карты</h3>
              <div
                style={{
                  marginBottom: 18,
                  borderRadius: 16,
                  padding: 18,
                  background: 'linear-gradient(135deg, #2B3E73 0%, #1F2B4D 45%, #C89B3C 100%)',
                  border: '1px solid rgba(255,255,255,.16)',
                  boxShadow: '0 16px 30px rgba(0,0,0,.35)',
                  minHeight: 190,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,.9)' }}>
                  <span style={{ fontSize: '.78rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>{cardBankPreview}</span>
                  <span style={{ fontSize: '1.2rem' }}>💳</span>
                </div>
                <div style={{ color: '#fff', fontSize: '1.15rem', letterSpacing: '.12em', fontWeight: 600 }}>
                  {cardNumberPreview}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'rgba(255,255,255,.72)', fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Card Holder
                    </div>
                    <div style={{ color: '#fff', fontSize: '.84rem', letterSpacing: '.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cardHolderPreview.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,.72)', fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Expires
                    </div>
                    <div style={{ color: '#fff', fontSize: '.9rem', letterSpacing: '.04em' }}>{cardExpiryPreview}</div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input
                  value={cardRequisites.phone}
                  onChange={(e) => setCardRequisites((prev) => ({ ...prev, phone: formatPhoneRu(e.target.value) }))}
                  placeholder="+7 (900) 000-00-00"
                  inputMode="tel"
                  maxLength={18}
                />
              </div>
              <div className="form-group">
                <label>Банк</label>
                <input
                  value={cardRequisites.bankName}
                  onChange={(e) => setCardRequisites((prev) => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Сбербанк / Т-Банк / ВТБ..."
                />
              </div>
              <div className="form-group">
                <label>Номер карты</label>
                <input
                  value={cardRequisites.cardNumber}
                  onChange={(e) => setCardRequisites((prev) => ({ ...prev, cardNumber: formatCardMasked(e.target.value) }))}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  maxLength={19}
                />
              </div>
              <div className="form-group">
                <label>Срок действия</label>
                <input
                  value={cardRequisites.cardExpiry}
                  onChange={(e) => setCardRequisites((prev) => ({ ...prev, cardExpiry: formatCardExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label>ФИО держателя карты</label>
                <input
                  value={cardRequisites.cardHolder}
                  onChange={(e) => setCardRequisites((prev) => ({ ...prev, cardHolder: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              {cardRequisites.updatedAt && (
                <div style={{ color: 'var(--text-dim)', fontSize: '.75rem', marginBottom: 10 }}>
                  Обновлено: {new Date(cardRequisites.updatedAt).toLocaleString('ru-RU')}
                </div>
              )}
              <button className="btn btn-gold" onClick={handleSaveCardRequisites} disabled={cardRequisitesBusy}>
                {cardRequisitesBusy ? 'Сохранение...' : 'Сохранить реквизиты'}
              </button>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Подсказка</h3>
              <p className="text-dim" style={{ lineHeight: 1.7 }}>
                Данные в форме сразу отображаются на карте сверху: можно проверить как будут выглядеть реквизиты
                перед сохранением. Номер карты автоматически форматируется в читаемый вид.
              </p>
            </div>
          </div>
        </div>

        {/* AI Match Panel */}
        <div className={`dash-panel ${activePanel === 'aiMatch' ? 'active' : ''}`}>
          <div style={{ background: 'linear-gradient(135deg, rgba(52,152,219,.12), rgba(52,152,219,.04))', border: '1px solid rgba(52,152,219,.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <div className="fw-600" style={{ color: 'var(--blue)', marginBottom: 4 }}>AI-алгоритм подбора</div>
              <div className="text-dim" style={{ fontSize: '.85rem' }}>Наш AI анализирует ваш инвестиционный профиль, предпочтения и историю сделок для максимально точного подбора стартапов.</div>
            </div>
          </div>

          {catalogData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка рекомендаций...</div>
          ) : (
            catalogData.map((s: any, i: number) => (
              <div className="ai-match-card" key={i} onClick={() => openModal('startupDetail')}>
                <div className="match-score" style={{ background: `conic-gradient(var(--gold) ${s.matchScore}%, var(--dark3) 0)` }}>
                  <span>{s.matchScore}%</span>
                </div>
                <div className="match-info" style={{ flex: 1 }}>
                  <h4>{s.emoji} {s.name}</h4>
                  <p>{s.sector} · {fmtStage(s.stage)} · Нужно {fmtMoney(s.investmentNeeded)} · ARR {fmtMoney(s.arrAmount)}</p>
                  <div className="match-tags">
                    <span className="sc-tag">{s.sector.split(' / ')[0]}</span>
                    <span className="sc-tag">{fmtStage(s.stage)}</span>
                    <span className="sc-tag">ARR {fmtMoney(s.arrAmount)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleStartChat(s.userId) }}>💬 Написать</button>
                  <button className="btn btn-gold btn-sm" onClick={(e) => { e.stopPropagation(); openModal('nda') }}>🔐 NDA</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Catalog Panel */}
        <div className={`dash-panel ${activePanel === 'catalog' ? 'active' : ''}`}>
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="Поиск стартапов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-outline btn-sm">🔍 Найти</button>
          </div>

          <div className="filter-row">
            {filters.map((f) => (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {catalogData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка каталога...</div>
          ) : (
            <div className="grid-2">
              {filteredCatalog.map((s: any, i: number) => (
                <div className="startup-card" key={i} onClick={() => openModal('startupDetail')}>
                  <div className="sc-header">
                    <div className="sc-logo">{s.emoji}</div>
                    <div className="sc-info">
                      <h3>{s.name}</h3>
                      <p>{s.sector}</p>
                    </div>
                  </div>
                  <div className="sc-tags">
                    <span className="sc-tag">{fmtStage(s.stage)}</span>
                    <span className="sc-tag">Нужно {fmtMoney(s.investmentNeeded)}</span>
                  </div>
                  <div className="sc-metrics">
                    <div className="sc-metric">
                      <div className="val">{fmtMoney(s.arrAmount)}</div>
                      <div className="key">ARR</div>
                    </div>
                    <div className="sc-metric">
                      <div className="val">{fmtMoney(s.investmentNeeded)}</div>
                      <div className="key">Запрос</div>
                    </div>
                    <div className="sc-metric">
                      <div className="val" style={{ color: s.matchScore >= 80 ? 'var(--green)' : 'var(--gold)' }}>{s.matchScore}%</div>
                      <div className="key">Match</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleStartChat(s.userId) }}>💬 Написать</button>
                    <button className="btn btn-gold btn-sm" onClick={(e) => { e.stopPropagation(); openModal('nda') }}>🔐 NDA</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className={`dash-panel ${activePanel === 'chat' ? 'active' : ''}`}>
          <div className="chat-layout">
            <div className="chat-list">
              <div className="chat-list-header">Сообщения</div>
              {chatList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет чатов</div>
              ) : (
                chatList.map((c) => (
                  <div
                    key={c.chatId}
                    className={`chat-item ${activeChatId === c.chatId ? 'active' : ''}`}
                    onClick={() => setActiveChatId(c.chatId)}
                  >
                    <div className="chat-item-name">{c.chatName || c.partnerName}</div>
                    <div className="chat-item-preview">{c.lastMessage?.content || ''}</div>
                    <div className="chat-item-time">{c.lastMessage?.createdAt ? fmtTime(c.lastMessage.createdAt) : ''}</div>
                  </div>
                ))
              )}
            </div>
            <div className="chat-main">
              {activeChat ? (
                <>
                  <div className="chat-header">
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '.8rem' }}>
                      {initials(activeChatName)}
                    </div>
                    <div>
                      <div className="fw-600">{activeChatName}</div>
                      <div className="text-dim" style={{ fontSize: '.75rem' }}>Онлайн</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <input
                        value={chatParticipantEmail}
                        onChange={(e) => setChatParticipantEmail(e.target.value)}
                        placeholder="email участника"
                        style={{ height: 34, minWidth: 180, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '0 10px', fontSize: '.8rem' }}
                      />
                      <button className="btn btn-outline btn-sm" onClick={handleAddChatParticipant} disabled={chatParticipantBusy}>
                        {chatParticipantBusy ? '...' : '+ Участник'}
                      </button>
                    </div>
                  </div>
                  <div className="chat-messages">
                    {chatLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка сообщений...</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div className={`msg ${msg.mine ? 'mine' : 'theirs'}`} key={i}>
                          <div className="msg-bubble">{msg.text}</div>
                          <div className="msg-time">{msg.time}</div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="chat-input-area">
                    <input
                      className="chat-input"
                      placeholder="Написать сообщение..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                    />
                    <button className="chat-send" onClick={handleSendMsg}>➤</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                  Выберите чат для начала общения
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events Panel */}
        <div className={`dash-panel ${activePanel === 'events' ? 'active' : ''}`}>
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
                      <button className="btn btn-outline btn-sm" onClick={() => showToast('Вы зарегистрированы!', '✅')}>
                        Участвовать
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deals Panel */}
        <div className={`dash-panel ${activePanel === 'deals' ? 'active' : ''}`}>
          {!dealsData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Загрузка сделок...</div>
          ) : (
            <>
              <div className="commission-notice">
                Комиссия платформы: <strong>{dealsData.length > 0 ? Math.round(dealsData[0].commissionRate * 100) : 8}%</strong> от суммы каждой сделки. Все сделки проводятся через безопасный эскроу-счёт LamInvest.
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>История сделок</h3>
                {dealsData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>Сделок пока нет</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Стартап</th>
                        <th>Сумма</th>
                        <th>Комиссия {Math.round(dealsData[0].commissionRate * 100)}%</th>
                        <th>Итого</th>
                        <th>Дата</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealsData.map((deal: any) => (
                        <tr key={deal.id}>
                          <td className="fw-600">{sectorEmoji(deal.startupSector)} {deal.startupName}</td>
                          <td>{fmtMoney(deal.amount)}</td>
                          <td className="text-gold fw-600">{fmtMoney(deal.commissionAmount)}</td>
                          <td className="fw-600">{fmtMoney(deal.totalAmount)}</td>
                          <td>{fmtDate(deal.createdAt)}</td>
                          <td>
                            <span className={`badge ${deal.status === 'COMPLETED' ? 'badge-green' : deal.status === 'IN_PROGRESS' ? 'badge-gold' : deal.status === 'CANCELLED' ? 'badge-red' : 'badge-blue'}`}>
                              {deal.status === 'COMPLETED' ? 'Завершена' : deal.status === 'IN_PROGRESS' ? 'В процессе' : deal.status === 'CANCELLED' ? 'Отменена' : 'Инициирована'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ marginTop: 24 }}>
                <button className="btn btn-gold" onClick={() => openModal('newDeal')}>
                  + Инициировать новую сделку
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
