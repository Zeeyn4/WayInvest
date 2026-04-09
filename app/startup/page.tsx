'use client'

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import {
  getStartupDashboardData,
  getStartupProfile,
  getStartupDocuments,
  getStartupNdas,
  getStartupTariff,
  getStartupEvents,
  getInvestorCatalog,
  simulateTariffPayment,
  uploadStartupProjectFile,
  createStartupInvestorReview,
} from '@/actions/startup.actions'
import { addChatParticipant, getChatList, getChatMessages, sendMessage, startChat } from '@/actions/chat.actions'

type Panel = 'dashboard' | 'profile' | 'project' | 'aiMatch' | 'catalog' | 'chat' | 'events' | 'tariff' | 'docs'

const panelTitles: Record<Panel, string> = {
  dashboard: 'Дашборд',
  profile: 'Мой профиль',
  project: 'Материалы проекта',
  aiMatch: 'AI-подбор',
  catalog: 'Каталог инвесторов',
  chat: 'Чаты',
  events: 'Мероприятия',
  tariff: 'Тариф',
  docs: 'Документы',
}

export default function StartupDashboard() {
  const [activePanel, setActivePanel] = useState<Panel>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Profile data
  const [profileData, setProfileData] = useState<any>(null)

  // Project / Documents data
  const [documentsData, setDocumentsData] = useState<any>(null)

  // AI Match / Catalog data
  const [catalogInvestors, setCatalogInvestors] = useState<any[]>([])

  // Chat data
  const [chatList, setChatList] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatParticipantEmail, setChatParticipantEmail] = useState('')
  const [chatParticipantBusy, setChatParticipantBusy] = useState(false)

  // Events data
  const [eventsData, setEventsData] = useState<any[]>([])

  // Tariff data
  const [tariffData, setTariffData] = useState<any>(null)
  const [tariffBuyBusySlug, setTariffBuyBusySlug] = useState<string | null>(null)
  const [paymentPlan, setPaymentPlan] = useState<{ slug: string; name: string; price: number } | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentCard, setPaymentCard] = useState('')
  const [paymentHolder, setPaymentHolder] = useState('')
  const [paymentExpiry, setPaymentExpiry] = useState('')
  const [paymentCvv, setPaymentCvv] = useState('')
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentTxnId, setPaymentTxnId] = useState('')

  // NDA data
  const [ndaData, setNdaData] = useState<any[]>([])

  // Catalog filter
  const [catalogFilter, setCatalogFilter] = useState('Все')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<{ investorId: string; investorName: string } | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBusy, setReviewBusy] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { showToast } = useApp()

  // Start or open existing chat with an investor
  async function handleStartChat(partnerUserId: string) {
    try {
      const chatId = await startChat(partnerUserId)
      setActivePanel('chat')
      const chats = await getChatList()
      setChatList(chats)
      setActiveChat(chatId)
      const msgs = await getChatMessages(chatId)
      setMessages(msgs)
      showToast('Чат открыт', '💬')
    } catch {
      showToast('Не удалось создать чат', '❌')
    }
  }

  // Fetch profile on mount for header display
  useEffect(() => {
    getStartupProfile().then(data => setProfileData(data)).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch data based on active panel
  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      try {
        switch (activePanel) {
          case 'dashboard': {
            const data = await getStartupDashboardData()
            if (!cancelled) setDashboardData(data)
            break
          }
          case 'profile': {
            const [profile, docs] = await Promise.all([
              getStartupProfile(),
              documentsData ? Promise.resolve(documentsData) : getStartupDocuments(),
            ])
            if (!cancelled) {
              setProfileData(profile)
              if (!documentsData) setDocumentsData(docs)
            }
            break
          }
          case 'project': {
            const [docs, ndas] = await Promise.all([getStartupDocuments(), getStartupNdas()])
            if (!cancelled) {
              setDocumentsData(docs)
              setNdaData(ndas)
            }
            break
          }
          case 'aiMatch':
          case 'catalog': {
            const data = await getInvestorCatalog()
            if (!cancelled) setCatalogInvestors(data)
            break
          }
          case 'chat': {
            const chats = await getChatList()
            if (!cancelled) {
              setChatList(chats)
              if (chats.length > 0 && !activeChat) {
                setActiveChat(chats[0].chatId)
                const msgs = await getChatMessages(chats[0].chatId)
                if (!cancelled) setMessages(msgs)
              }
            }
            break
          }
          case 'events': {
            const data = await getStartupEvents()
            if (!cancelled) setEventsData(data)
            break
          }
          case 'tariff': {
            const data = await getStartupTariff()
            if (!cancelled) setTariffData(data)
            break
          }
          case 'docs': {
            const ndas = await getStartupNdas()
            if (!cancelled) setNdaData(ndas)
            break
          }
        }
      } catch (err) {
        console.error('Failed to fetch data for panel:', activePanel, err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [activePanel])

  // Fetch messages when active chat changes
  const handleChatSelect = useCallback(async (chatId: string) => {
    setActiveChat(chatId)
    try {
      const msgs = await getChatMessages(chatId)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setMessages([])
    }
  }, [])

  const sendMsg = async () => {
    if (!chatInput.trim() || !activeChat) return
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      content: chatInput,
      isMine: true,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev: any[]) => [...prev, optimisticMsg])
    const content = chatInput
    setChatInput('')
    try {
      await sendMessage(activeChat, content)
      // Refresh messages to get server-confirmed version
      const msgs = await getChatMessages(activeChat)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const addParticipantToChat = async () => {
    if (!activeChat || !chatParticipantEmail.trim()) return
    setChatParticipantBusy(true)
    try {
      const res = await addChatParticipant(activeChat, chatParticipantEmail.trim())
      setChatParticipantEmail('')
      const chats = await getChatList()
      setChatList(chats)
      const msgs = await getChatMessages(activeChat)
      setMessages(msgs)
      showToast(res.message || 'Участник добавлен', '👥')
    } catch {
      showToast('Не удалось добавить участника', '❌')
    } finally {
      setChatParticipantBusy(false)
    }
  }

  const buyTariff = async (slug: string, name: string) => {
    setTariffBuyBusySlug(slug)
    try {
      const res = await simulateTariffPayment(slug)
      showToast(res.message || `Тариф ${name} активирован`, '💳')
      const data = await getStartupTariff()
      setTariffData(data)
    } catch {
      showToast('Не удалось выполнить оплату тарифа', '❌')
    } finally {
      setTariffBuyBusySlug(null)
    }
  }

  const openPaymentScenario = (plan: { slug: string; name: string; price: number }) => {
    setPaymentPlan(plan)
    setPaymentAmount(String(plan.price))
    setPaymentCard('')
    setPaymentHolder('')
    setPaymentExpiry('')
    setPaymentCvv('')
    setPaymentSuccess(false)
    setPaymentTxnId('')
  }

  const closePaymentScenario = () => {
    if (paymentBusy) return
    setPaymentPlan(null)
    setPaymentSuccess(false)
    setPaymentTxnId('')
  }

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length < 3) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  const handleFakePayment = async () => {
    if (!paymentPlan) return
    const amount = Number(paymentAmount)
    const cardDigits = paymentCard.replace(/\D/g, '')
    const cvvDigits = paymentCvv.replace(/\D/g, '')
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Введите корректную сумму', '⚠️')
      return
    }
    if (cardDigits.length < 16) {
      showToast('Введите номер карты полностью', '⚠️')
      return
    }
    if (!paymentHolder.trim()) {
      showToast('Введите имя владельца карты', '⚠️')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(paymentExpiry)) {
      showToast('Срок карты в формате MM/YY', '⚠️')
      return
    }
    if (cvvDigits.length < 3) {
      showToast('Введите CVV', '⚠️')
      return
    }

    setPaymentBusy(true)
    try {
      showToast('Проверяем реквизиты...', '💳')
      await new Promise((resolve) => setTimeout(resolve, 900))
      showToast('Списываем средства...', '⏳')
      await new Promise((resolve) => setTimeout(resolve, 1200))
      await buyTariff(paymentPlan.slug, paymentPlan.name)
      setPaymentTxnId(`TXN-${Date.now().toString().slice(-8)}`)
      setPaymentSuccess(true)
    } finally {
      setPaymentBusy(false)
    }
  }

  const uploadProjectDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      await uploadStartupProjectFile({
        fileName: file.name,
        fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        accessLevel: 'nda',
      })
      const docs = await getStartupDocuments()
      setDocumentsData(docs)
      showToast('Файл загружен', '📎')
    } catch {
      showToast('Ошибка загрузки файла', '❌')
    } finally {
      setUploadingDoc(false)
      event.target.value = ''
    }
  }

  const viewProfileMaterial = (file: any) => {
    if (!file?.fileUrl) {
      showToast('Ссылка на файл недоступна', '⚠️')
      return
    }
    window.open(file.fileUrl, '_blank', 'noopener,noreferrer')
  }

  const openReviewModal = (investorId: string, investorName: string) => {
    setReviewTarget({ investorId, investorName })
    setReviewText('')
    setReviewRating(5)
  }

  const submitReview = async () => {
    if (!reviewTarget) return
    if (!reviewText.trim()) {
      showToast('Введите текст отзыва', '⚠️')
      return
    }
    setReviewBusy(true)
    try {
      await createStartupInvestorReview({
        investorId: reviewTarget.investorId,
        text: reviewText,
        rating: reviewRating,
      })
      showToast('Отзыв отправлен', '✅')
      setReviewTarget(null)
    } catch {
      showToast('Не удалось отправить отзыв', '❌')
    } finally {
      setReviewBusy(false)
    }
  }

  const filters = ['Все', 'IT', 'Ритейл', 'Финтех', 'Pre-seed', 'Seed']

  const activeChatData = chatList.find((c: any) => c.chatId === activeChat)

  // Loading placeholder
  const LoadingBlock = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
      <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>Загрузка...</span>
    </div>
  )

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      {sidebarOpen && <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo" onClick={() => router.push('/')}>Way<span>Invest</span></div>

        <div className="sidebar-section">Основное</div>
        <div className={`sidebar-item${activePanel === 'dashboard' ? ' active' : ''}`} onClick={() => { setActivePanel('dashboard'); setSidebarOpen(false) }}>
          <span className="icon">📊</span> Дашборд
        </div>
        <div className={`sidebar-item${activePanel === 'profile' ? ' active' : ''}`} onClick={() => { setActivePanel('profile'); setSidebarOpen(false) }}>
          <span className="icon">👤</span> Мой профиль
        </div>
        <div className={`sidebar-item${activePanel === 'project' ? ' active' : ''}`} onClick={() => { setActivePanel('project'); setSidebarOpen(false) }}>
          <span className="icon">📁</span> Мой проект
        </div>

        <div className="sidebar-section">Инвесторы</div>
        <div className={`sidebar-item${activePanel === 'aiMatch' ? ' active' : ''}`} onClick={() => { setActivePanel('aiMatch'); setSidebarOpen(false) }}>
          <span className="icon">🤖</span> AI-подбор
        </div>
        <div className={`sidebar-item${activePanel === 'catalog' ? ' active' : ''}`} onClick={() => { setActivePanel('catalog'); setSidebarOpen(false) }}>
          <span className="icon">📋</span> Каталог инвесторов
        </div>

        <div className="sidebar-section">Коммуникации</div>
        <div className={`sidebar-item${activePanel === 'chat' ? ' active' : ''}`} onClick={() => { setActivePanel('chat'); setSidebarOpen(false) }}>
          <span className="icon">💬</span> Чаты
        </div>
        <div className={`sidebar-item${activePanel === 'events' ? ' active' : ''}`} onClick={() => { setActivePanel('events'); setSidebarOpen(false) }}>
          <span className="icon">📅</span> Мероприятия
        </div>

        <div className="sidebar-section">Настройки</div>
        <div className={`sidebar-item${activePanel === 'tariff' ? ' active' : ''}`} onClick={() => { setActivePanel('tariff'); setSidebarOpen(false) }}>
          <span className="icon">💎</span> Тариф
        </div>
        <div className={`sidebar-item${activePanel === 'docs' ? ' active' : ''}`} onClick={() => { setActivePanel('docs'); setSidebarOpen(false) }}>
          <span className="icon">📄</span> Документы
        </div>

        <div style={{ padding: '20px 24px', marginTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => { router.push('/'); setSidebarOpen(false) }}>
            🚪 Выйти
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="dash-main">
        <div className="dash-header">
          <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{marginRight:12}}>☰</button>
          <h1>{panelTitles[activePanel]}</h1>
          <div className="dash-user">
            <button className="notif-btn">🔔<span className="notif-dot"></span></button>
            <div className="avatar">{profileData?.name ? profileData.name.slice(0, 2) : 'ТЧ'}</div>
            <span style={{ fontSize: '.9rem' }}>{profileData?.name || 'Загрузка...'}</span>
          </div>
        </div>

        {/* ===== DASHBOARD ===== */}
        <div className={`dash-panel${activePanel === 'dashboard' ? ' active' : ''}`}>
          {loading && !dashboardData ? <LoadingBlock /> : dashboardData ? (
            <>
              <div style={{ background: 'linear-gradient(135deg, rgba(46,204,113,.15), rgba(46,204,113,.05))', border: '1px solid rgba(46,204,113,.3)', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.3rem' }}>✨</span>
                <div>
                  <strong style={{ color: 'var(--green)' }}>Тариф: {dashboardData.tariff?.name || 'Не определён'}</strong>
                  <span style={{ color: 'var(--text-dim)', fontSize: '.85rem', marginLeft: '12px' }}>
                    {dashboardData.tariff?.activeUntil ? `Активен до ${dashboardData.tariff.activeUntil}` : ''}
                  </span>
                </div>
              </div>

              <div className="grid-4" style={{ marginBottom: '28px' }}>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats?.views ?? 0}</div>
                  <div className="lbl">просмотров</div>
                </div>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats?.responses ?? 0}</div>
                  <div className="lbl">откликов</div>
                </div>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats?.negotiations ?? 0}</div>
                  <div className="lbl">переговоров</div>
                </div>
                <div className="stat-box">
                  <div className="num">{dashboardData.stats?.aiRating ?? 0}%</div>
                  <div className="lbl">AI рейтинг</div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>📈 Интерес инвесторов</h3>
                  {(dashboardData.interests ?? [
                    { label: 'Просмотры профиля', val: 0 },
                    { label: 'Скачивание PitchDeck', val: 0 },
                    { label: 'Запросы на встречу', val: 0 },
                    { label: 'Повторные просмотры', val: 0 },
                  ]).map((item: any, i: number) => (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      <div className="flex-between">
                        <span style={{ fontSize: '.85rem' }}>{item.label}</span>
                        <span style={{ fontSize: '.85rem', color: 'var(--gold)' }}>{item.val}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${item.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>💬 Последние отклики</h3>
                  {(dashboardData.recentResponses ?? []).length === 0 ? (
                    <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Пока нет откликов</p>
                  ) : (
                    dashboardData.recentResponses.map((item: any, i: number) => (
                      <div key={i} style={{ padding: '14px 0', borderBottom: i < dashboardData.recentResponses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div className="flex-between">
                          <span className="fw-600" style={{ fontSize: '.9rem' }}>{item.name}</span>
                          <span className={`badge ${item.badge}`}>{item.badgeText}</span>
                        </div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '.83rem', margin: '6px 0 4px' }}>{item.text}</p>
                        <span style={{ color: 'var(--text-dim)', fontSize: '.72rem' }}>{item.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ===== PROFILE ===== */}
        <div className={`dash-panel${activePanel === 'profile' ? ' active' : ''}`}>
          {loading && !profileData ? <LoadingBlock /> : profileData ? (
            <>
              <div className="profile-header">
                <div className="profile-avatar">{profileData.emoji || '🚀'}</div>
                <div className="profile-info">
                  <h2>{profileData.name || ''}</h2>
                  <p>{profileData.sector || ''} &bull; <span className="badge badge-gold" style={{ marginLeft: '4px' }}>{profileData.stage || ''}</span></p>
                  <div className="profile-stats">
                    <div className="pstat"><div className="n">{profileData.months ?? 0}</div><div className="l">месяцев</div></div>
                    <div className="pstat"><div className="n">{profileData.users ?? 0}</div><div className="l">users</div></div>
                    <div className="pstat"><div className="n">{profileData.arr || '₽0'}</div><div className="l">ARR</div></div>
                    <div className="pstat"><div className="n">{profileData.rating ?? 0}⭐</div><div className="l">рейтинг</div></div>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>✏️ Редактировать профиль</h3>
                  <div className="form-group">
                    <label>Название проекта</label>
                    <input type="text" defaultValue={profileData.name || ''} />
                  </div>
                  <div className="form-group">
                    <label>Сектор</label>
                    <select defaultValue={profileData.sector || ''}>
                      <option>IT / Маркетплейс</option>
                      <option>Финтех</option>
                      <option>Агротех</option>
                      <option>Логистика</option>
                      <option>Ритейл</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Стадия</label>
                    <select defaultValue={profileData.stage || ''}>
                      <option>Pre-seed</option>
                      <option>Seed</option>
                      <option>Раунд A</option>
                      <option>Раунд B</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Потребность в инвестициях</label>
                    <input type="text" defaultValue={profileData.investmentNeed || ''} />
                  </div>
                  <div className="form-group">
                    <label>Описание</label>
                    <textarea defaultValue={profileData.description || ''} />
                  </div>
                  <button className="btn btn-gold">Сохранить</button>
                </div>

                <div>
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>📎 Материалы проекта</h3>
                    {(documentsData?.files ?? []).length === 0 ? (
                      <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Материалы не загружены</p>
                    ) : (
                      (documentsData?.files ?? []).slice(0, 5).map((file: any) => (
                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '1.1rem' }}>{file.icon || '📄'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="fw-600" style={{ fontSize: '.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>{file.size} • {file.date}</div>
                          </div>
                          <button className="btn btn-outline btn-sm" onClick={() => viewProfileMaterial(file)}>Открыть</button>
                        </div>
                      ))
                    )}
                    <button className="btn btn-ghost btn-sm mt-16" style={{ width: '100%' }} onClick={() => setActivePanel('project')}>
                      Перейти в «Мой проект»
                    </button>
                  </div>

                  <div className="card">
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>🏷️ Теги</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(profileData.tags ?? []).length === 0 ? (
                        <span style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет тегов</span>
                      ) : (
                        profileData.tags.map((tag: string) => (
                          <span key={tag} className="badge badge-gold">{tag}</span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ===== PROJECT ===== */}
        <div className={`dash-panel${activePanel === 'project' ? ' active' : ''}`}>
          {loading && !documentsData ? <LoadingBlock /> : (
            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>📎 Загруженные материалы</h3>
                {(documentsData?.files ?? []).length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет загруженных документов</p>
                ) : (
                  documentsData.files.map((file: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'var(--dark3)', borderRadius: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{file.icon || '📄'}</span>
                      <div style={{ flex: 1 }}>
                        <div className="fw-600" style={{ fontSize: '.88rem' }}>{file.name}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>{file.size} &bull; {file.date}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm">👁️</button>
                    </div>
                  ))
                )}
                <label className="btn btn-outline btn-sm mt-16" style={{ width: '100%', justifyContent: 'center', cursor: uploadingDoc ? 'not-allowed' : 'pointer', opacity: uploadingDoc ? 0.6 : 1 }}>
                  {uploadingDoc ? 'Загрузка...' : '+ Загрузить документ'}
                  <input type="file" style={{ display: 'none' }} onChange={uploadProjectDocument} disabled={uploadingDoc} />
                </label>
              </div>

              <div>
                <div className="card" style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>👁️ Журнал просмотров</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Инвестор</th>
                        <th>Документ</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(documentsData?.viewLog ?? []).length === 0 ? (
                        <tr><td colSpan={3} style={{ color: 'var(--text-dim)', textAlign: 'center' }}>Нет просмотров</td></tr>
                      ) : (
                        documentsData.viewLog.map((row: any, i: number) => (
                          <tr key={i}>
                            <td>{row.inv}</td>
                            <td>{row.doc}</td>
                            <td style={{ color: 'var(--text-dim)' }}>{row.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="nda-overlay">
                  <div className="nda-icon">🔒</div>
                  <h3>Защита NDA</h3>
                  <p>Все документы защищены водяными знаками и доступны участникам чата после подписания NDA.</p>
                  <button className="btn btn-gold btn-sm">Настроить доступ</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== AI MATCH ===== */}
        <div className={`dash-panel${activePanel === 'aiMatch' ? ' active' : ''}`}>
          {loading && catalogInvestors.length === 0 ? <LoadingBlock /> : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>🤖 AI рекомендации для {profileData?.name || 'вашего проекта'}</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Алгоритм проанализировал {catalogInvestors.length} инвесторов и подобрал лучших</p>
                </div>
                <button className="btn btn-outline btn-sm">🔄 Обновить</button>
              </div>

              {catalogInvestors.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет подходящих инвесторов</p>
              ) : (
                catalogInvestors.map((inv: any, i: number) => (
                  <div key={inv.id || i} className="ai-match-card">
                    <div
                      className="match-score"
                      style={{
                        background: `conic-gradient(var(--gold) ${(inv.aiScore ?? 0) * 3.6}deg, var(--dark3) 0deg)`,
                      }}
                    >
                      <span>{inv.aiScore ?? 0}%</span>
                    </div>
                    <div className="match-info">
                      <h4>{inv.name}</h4>
                      <p>{inv.focus} &bull; {inv.check} &bull; {inv.stage}</p>
                      <div className="match-tags">
                        {(inv.focus || '').split(', ').filter(Boolean).map((tag: string) => (
                          <span key={tag} className="badge badge-gold">{tag}</span>
                        ))}
                        <span className="badge badge-green">{inv.status}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: 'var(--gold)', fontSize: '.8rem', marginBottom: '8px' }}>⭐ {inv.rating}</div>
                      <button className="btn btn-gold btn-sm" onClick={() => handleStartChat(inv.userId)}>💬 Написать</button>
                      <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => openReviewModal(inv.id, inv.name)}>✍️ Отзыв</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* ===== CATALOG ===== */}
        <div className={`dash-panel${activePanel === 'catalog' ? ' active' : ''}`}>
          {loading && catalogInvestors.length === 0 ? <LoadingBlock /> : (
            <>
              <div className="search-bar">
                <input className="search-input" placeholder="Поиск инвесторов по имени, сектору..." />
                <button className="btn btn-gold">🔍 Найти</button>
              </div>

              <div className="filter-row">
                {filters.map(f => (
                  <button
                    key={f}
                    className={`filter-btn${catalogFilter === f ? ' active' : ''}`}
                    onClick={() => setCatalogFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid-2">
                {catalogInvestors.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет инвесторов в каталоге</p>
                ) : (
                  catalogInvestors.map((inv: any, i: number) => (
                    <div key={inv.id || i} className="card" style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>{inv.name.split(' ').map((w: string) => w[0]).join('')}</div>
                        <div>
                          <div className="fw-600">{inv.name}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '.82rem' }}>{inv.focus}</div>
                        </div>
                        <span className="badge badge-green" style={{ marginLeft: 'auto' }}>{inv.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {(inv.focus || '').split(', ').filter(Boolean).map((tag: string) => (
                          <span key={tag} className="badge badge-gold">{tag}</span>
                        ))}
                        {(inv.stage || '').split(', ').filter(Boolean).map((tag: string) => (
                          <span key={tag} className="badge badge-blue">{tag}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '.72rem' }}>Чек</div>
                          <div className="fw-600" style={{ color: 'var(--gold)', fontSize: '.9rem' }}>{inv.check}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: 'var(--text-dim)', fontSize: '.72rem' }}>Рейтинг</div>
                          <div className="fw-600" style={{ color: 'var(--gold)', fontSize: '.9rem' }}>⭐ {inv.rating}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleStartChat(inv.userId)}>💬 Написать</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openReviewModal(inv.id, inv.name)}>✍️ Отзыв</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ===== CHAT ===== */}
        <div className={`dash-panel${activePanel === 'chat' ? ' active' : ''}`}>
          {loading && chatList.length === 0 ? <LoadingBlock /> : (
            <div className="chat-layout">
              <div className="chat-list">
                <div className="chat-list-header">💬 Сообщения</div>
                {chatList.length === 0 ? (
                  <div style={{ padding: '20px', color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет чатов</div>
                ) : (
                  chatList.map((c: any) => (
                    <div
                      key={c.chatId}
                      className={`chat-item${activeChat === c.chatId ? ' active' : ''}`}
                      onClick={() => handleChatSelect(c.chatId)}
                    >
                      <div className="chat-item-name">{c.chatName || c.partnerName}</div>
                      <div className="chat-item-preview">{c.lastMessage?.content || 'Нет сообщений'}</div>
                      <div className="chat-item-time">{c.lastMessage?.createdAt ? new Date(c.lastMessage.createdAt).toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'}) : ''}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="chat-main">
                {activeChatData ? (
                  <>
                    <div className="chat-header">
                      <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '.8rem' }}>
                        {(activeChatData.chatName || activeChatData.partnerName || '??').split(' ').map((w: string) => w[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div className="fw-600" style={{ fontSize: '.9rem' }}>{activeChatData.chatName || activeChatData.partnerName}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>
                          {activeChatData.partnerRole === 'INVESTOR' ? '● Инвестор' : '● Стартап'}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <input
                          value={chatParticipantEmail}
                          onChange={(e) => setChatParticipantEmail(e.target.value)}
                          placeholder="email участника"
                          style={{ height: 34, minWidth: 180, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '0 10px', fontSize: '.8rem' }}
                        />
                        <button className="btn btn-outline btn-sm" onClick={addParticipantToChat} disabled={chatParticipantBusy}>
                          {chatParticipantBusy ? '...' : '+ Участник'}
                        </button>
                      </div>
                    </div>
                    <div className="chat-messages">
                      {messages.map((msg: any) => (
                        <div key={msg.id} className={`msg${msg.isMine ? ' mine' : ' theirs'}`}>
                          <div className="msg-bubble">{msg.content}</div>
                          <div className="msg-time">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'}) : ''}</div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input-area">
                      <input
                        className="chat-input"
                        placeholder="Написать сообщение..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMsg()}
                      />
                      <button className="chat-send" onClick={sendMsg}>➤</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                    Выберите чат
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== EVENTS ===== */}
        <div className={`dash-panel${activePanel === 'events' ? ' active' : ''}`}>
          {loading && eventsData.length === 0 ? <LoadingBlock /> : (
            <div className="grid-2">
              {eventsData.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Нет мероприятий</p>
              ) : (
                eventsData.map((ev: any, i: number) => (
                  <div key={ev.id || i} className="event-card">
                    <div className="event-banner">{ev.emoji}</div>
                    <div className="event-body">
                      <div className="event-date">📅 {ev.date} &bull; {ev.time}</div>
                      <div className="event-title">{ev.title}</div>
                      <div className="event-desc">{ev.desc}</div>
                      <div className="event-footer">
                        <div className="event-participants">👥 {ev.participants} участников</div>
                        <button className="btn btn-gold btn-sm">Записаться</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ===== TARIFF ===== */}
        <div className={`dash-panel${activePanel === 'tariff' ? ' active' : ''}`}>
          {loading && !tariffData ? <LoadingBlock /> : (
            <>
              <div className="commission-notice">
                <strong>Комиссия платформы: 8%</strong> от суммы сделки взимается только при успешном закрытии инвестиционного раунда. Никаких скрытых платежей.
              </div>
              <div style={{ marginBottom: 20, color: 'var(--text-dim)', fontSize: '.9rem' }}>
                Раздел подписки для стартапов: выберите пакет и оформите покупку. Оплата ниже работает как безопасная имитация с серверной фиксацией.
              </div>

              <div className="grid-4">
                {(tariffData?.plans ?? []).map((plan: any, i: number) => (
                  <div key={plan.id || i} className={`pkg-card${plan.isCurrent ? ' featured' : ''}`}>
                    {plan.isCurrent && <div className="pkg-badge">ВЫ ЗДЕСЬ</div>}
                    <div className="pkg-name">{plan.name}</div>
                    <div className="pkg-price">
                      {plan.price === 0 ? 'Бесплатно' : (
                        <>{plan.priceFormatted || `₽${plan.price.toLocaleString('ru-RU')}`}<span>/мес</span></>
                      )}
                    </div>
                    <ul className="pkg-features">
                      {(plan.features ?? []).map((f: any, fi: number) => (
                        <li key={fi} className={f?.included === false ? 'no' : ''}>{typeof f === 'string' ? f : f.text}</li>
                      ))}
                    </ul>
                    {plan.isCurrent ? (
                      <button className="btn btn-gold btn-sm" style={{ width: '100%' }} disabled>Активен</button>
                    ) : plan.price === 0 ? (
                      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => buyTariff(plan.slug, plan.name)} disabled={tariffBuyBusySlug === plan.slug}>
                        {tariffBuyBusySlug === plan.slug ? 'Подключение...' : 'Подключить'}
                      </button>
                    ) : (
                      <button className="btn btn-gold btn-sm" style={{ width: '100%' }} onClick={() => openPaymentScenario({ slug: plan.slug, name: plan.name, price: plan.price })} disabled={tariffBuyBusySlug === plan.slug || paymentBusy}>
                        Оплатить и подключить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fake payment scenario modal */}
        {paymentPlan && (
          <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closePaymentScenario() }}>
            <div className="modal" style={{ maxWidth: 560 }}>
              <button className="modal-close" onClick={closePaymentScenario}>✕</button>
              <h2>Оплата тарифа: {paymentPlan.name}</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: 18 }}>
                Фейковый сценарий оплаты: введите сумму и реквизиты карты, после чего тариф будет активирован в системе.
              </p>

              {paymentSuccess ? (
                <div style={{ textAlign: 'center', padding: '18px 6px 4px' }}>
                  <div className="payment-success-check">✓</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>Оплата прошла успешно</div>
                  <div style={{ color: 'var(--text-dim)', marginBottom: 14 }}>Тариф <strong style={{ color: 'var(--gold)' }}>{paymentPlan.name}</strong> активирован</div>
                  <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: '.85rem', color: 'var(--text-dim)', marginBottom: 14 }}>
                    ID операции: <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{paymentTxnId}</span>
                  </div>
                  <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={closePaymentScenario}>
                    Готово
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Сумма (₽)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      disabled={paymentBusy}
                    />
                  </div>
                  <div className="form-group">
                    <label>Номер карты</label>
                    <input
                      placeholder="0000 0000 0000 0000"
                      value={paymentCard}
                      onChange={(e) => setPaymentCard(formatCardNumber(e.target.value))}
                      maxLength={19}
                      inputMode="numeric"
                      disabled={paymentBusy}
                    />
                  </div>
                  <div className="form-group">
                    <label>Владелец карты</label>
                    <input
                      placeholder="IVAN IVANOV"
                      value={paymentHolder}
                      onChange={(e) => setPaymentHolder(e.target.value.toUpperCase())}
                      disabled={paymentBusy}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Срок (MM/YY)</label>
                      <input
                        placeholder="12/28"
                        value={paymentExpiry}
                        onChange={(e) => setPaymentExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        inputMode="numeric"
                        disabled={paymentBusy}
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        placeholder="123"
                        value={paymentCvv}
                        onChange={(e) => setPaymentCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        maxLength={3}
                        inputMode="numeric"
                        disabled={paymentBusy}
                      />
                    </div>
                  </div>
                  <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={handleFakePayment} disabled={paymentBusy}>
                    {paymentBusy ? 'Обработка платежа...' : 'Оплатить'}
                  </button>
                </>
              )}
              <style jsx>{`
                .payment-success-check {
                  width: 74px;
                  height: 74px;
                  margin: 0 auto 12px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 2rem;
                  font-weight: 700;
                  color: #0f5132;
                  background: rgba(46, 204, 113, 0.22);
                  border: 1px solid rgba(46, 204, 113, 0.45);
                  animation: paySuccessPop 420ms ease-out;
                }
                @keyframes paySuccessPop {
                  0% { transform: scale(0.7); opacity: 0; }
                  70% { transform: scale(1.08); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Review modal */}
        {reviewTarget && (
          <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget && !reviewBusy) setReviewTarget(null) }}>
            <div className="modal" style={{ maxWidth: 620 }}>
              <button className="modal-close" onClick={() => !reviewBusy && setReviewTarget(null)}>✕</button>
              <h2>Отзыв инвестору</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: 18 }}>
                Инвестор: <strong style={{ color: 'var(--gold)' }}>{reviewTarget.investorName}</strong>
              </p>
              <div className="form-group">
                <label>Оценка</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} disabled={reviewBusy}>
                  <option value={5}>5 — Отлично</option>
                  <option value={4}>4 — Хорошо</option>
                  <option value={3}>3 — Нормально</option>
                  <option value={2}>2 — Слабо</option>
                  <option value={1}>1 — Плохо</option>
                </select>
              </div>
              <div className="form-group">
                <label>Текст отзыва</label>
                <textarea
                  placeholder="Опишите опыт взаимодействия с инвестором..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={reviewBusy}
                />
              </div>
              <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={submitReview} disabled={reviewBusy}>
                {reviewBusy ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </div>
          </div>
        )}

        {/* ===== DOCS ===== */}
        <div className={`dash-panel${activePanel === 'docs' ? ' active' : ''}`}>
          {loading && ndaData.length === 0 ? <LoadingBlock /> : (
            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>📋 Пользовательское соглашение</h3>
                <div style={{ padding: '16px', background: 'var(--dark3)', borderRadius: '10px', marginBottom: '16px' }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: '.85rem', lineHeight: '1.7' }}>
                    Комиссия платформы составляет <strong style={{ color: 'var(--gold)' }}>8%</strong> от суммы успешной сделки. Комиссия взимается только при закрытии раунда инвестиций. Платформа обеспечивает безопасность данных и защиту интеллектуальной собственности всех участников.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline btn-sm">📄 Полный текст</button>
                  <button className="btn btn-ghost btn-sm">📥 Скачать PDF</button>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>🔒 NDA соглашения</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Инвестор</th>
                      <th>Дата</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ndaData.length === 0 ? (
                      <tr><td colSpan={3} style={{ color: 'var(--text-dim)', textAlign: 'center' }}>Нет NDA соглашений</td></tr>
                    ) : (
                      ndaData.map((nda: any, i: number) => (
                        <tr key={nda.id || i}>
                          <td>{nda.investor}</td>
                          <td>{nda.date}</td>
                          <td><span className={`badge ${nda.statusBadge || 'badge-green'}`}>{nda.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
