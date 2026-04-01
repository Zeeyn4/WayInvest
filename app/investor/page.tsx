'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { startups, events } from '@/lib/data'

type Panel = 'dashboard' | 'profile' | 'verify' | 'aiMatch' | 'catalog' | 'chat' | 'events' | 'deals'

const panelTitles: Record<Panel, string> = {
  dashboard: 'Дашборд',
  profile: 'Мой профиль',
  verify: 'Верификация',
  aiMatch: 'AI-подбор стартапов',
  catalog: 'Каталог стартапов',
  chat: 'Чаты',
  events: 'Мероприятия',
  deals: 'Мои сделки',
}

interface ChatMessage {
  text: string
  mine: boolean
  time: string
}

export default function InvestorPage() {
  const [activePanel, setActivePanel] = useState<Panel>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Все')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { text: 'Здравствуйте! Мы рады, что вас заинтересовал наш проект.', mine: false, time: '10:30' },
    { text: 'Добрый день! Расскажите подробнее о вашей бизнес-модели.', mine: true, time: '10:32' },
    { text: 'Конечно! Мы работаем по модели маркетплейса с комиссией 5% с каждой транзакции. ARR уже ₽4.2М.', mine: false, time: '10:34' },
    { text: 'Интересно. Какой объём инвестиций вы ищете и на что планируете потратить?', mine: true, time: '10:36' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [activeChat, setActiveChat] = useState('ТехЧечня')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { openModal, showToast } = useApp()

  const filters = ['Все', 'IT', 'Агротех', 'Финтех', 'Pre-seed', 'Seed']

  const filteredStartups = startups.filter((s) => {
    if (activeFilter === 'Все') return true
    return s.sector.includes(activeFilter) || s.stage === activeFilter
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendMsg = () => {
    if (!chatInput.trim()) return
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    setChatMessages((prev) => [...prev, { text: chatInput, mine: true, time }])
    setChatInput('')

    setTimeout(() => {
      const replyTime = new Date()
      const rTime = `${replyTime.getHours()}:${String(replyTime.getMinutes()).padStart(2, '0')}`
      setChatMessages((prev) => [
        ...prev,
        { text: 'Спасибо за вопрос! Мы подготовим детальный ответ и вернёмся к вам в ближайшее время.', mine: false, time: rTime },
      ])
    }, 1200)
  }

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => router.push('/')}>
          Way<span>Invest</span>
        </div>

        <div style={{ padding: '16px 24px' }}>
          <span className="badge badge-green">✅ Верифицирован</span>
        </div>

        <div className="sidebar-section">Основное</div>
        <div
          className={`sidebar-item ${activePanel === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePanel('dashboard')}
        >
          <span className="icon">📊</span> Дашборд
        </div>
        <div
          className={`sidebar-item ${activePanel === 'profile' ? 'active' : ''}`}
          onClick={() => setActivePanel('profile')}
        >
          <span className="icon">👤</span> Мой профиль
        </div>
        <div
          className={`sidebar-item ${activePanel === 'verify' ? 'active' : ''}`}
          onClick={() => setActivePanel('verify')}
        >
          <span className="icon">🛡️</span> Верификация
        </div>

        <div className="sidebar-section">Стартапы</div>
        <div
          className={`sidebar-item ${activePanel === 'aiMatch' ? 'active' : ''}`}
          onClick={() => setActivePanel('aiMatch')}
        >
          <span className="icon">🤖</span> AI-подбор
        </div>
        <div
          className={`sidebar-item ${activePanel === 'catalog' ? 'active' : ''}`}
          onClick={() => setActivePanel('catalog')}
        >
          <span className="icon">📋</span> Каталог стартапов
        </div>

        <div className="sidebar-section">Коммуникации</div>
        <div
          className={`sidebar-item ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => setActivePanel('chat')}
        >
          <span className="icon">💬</span> Чаты
        </div>
        <div
          className={`sidebar-item ${activePanel === 'events' ? 'active' : ''}`}
          onClick={() => setActivePanel('events')}
        >
          <span className="icon">📅</span> Мероприятия
        </div>

        <div className="sidebar-section">Сделки</div>
        <div
          className={`sidebar-item ${activePanel === 'deals' ? 'active' : ''}`}
          onClick={() => setActivePanel('deals')}
        >
          <span className="icon">🤝</span> Мои сделки
        </div>

        <div className="sidebar-section" />
        <div className="sidebar-item" onClick={() => router.push('/')}>
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
            <div className="avatar">РБ</div>
            <span>Рустам Б.</span>
          </div>
        </div>

        {/* Dashboard Panel */}
        <div className={`dash-panel ${activePanel === 'dashboard' ? 'active' : ''}`}>
          <div style={{ background: 'rgba(46,204,113,.1)', border: '1px solid rgba(46,204,113,.3)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.3rem' }}>✅</span>
            <div>
              <div className="fw-600 text-green">Аккаунт верифицирован</div>
              <div className="text-dim" style={{ fontSize: '.85rem' }}>Вам доступны все функции платформы, включая AI-подбор и прямые сделки.</div>
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom: 28 }}>
            <div className="stat-box">
              <div className="num">34</div>
              <div className="lbl">просмотрено</div>
            </div>
            <div className="stat-box">
              <div className="num">8</div>
              <div className="lbl">переговоров</div>
            </div>
            <div className="stat-box">
              <div className="num">2</div>
              <div className="lbl">сделки</div>
            </div>
            <div className="stat-box">
              <div className="num">₽42М</div>
              <div className="lbl">инвестировано</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h3>AI-рекомендации</h3>
                <span className="text-dim" style={{ fontSize: '.82rem', cursor: 'pointer' }} onClick={() => setActivePanel('aiMatch')}>Все →</span>
              </div>
              {startups.slice(0, 2).map((s, i) => (
                <div className="ai-match-card" key={i} onClick={() => openModal('startupDetail')}>
                  <div className="match-score" style={{ background: `conic-gradient(var(--gold) ${s.match}%, var(--dark3) 0)` }}>
                    <span>{s.match}%</span>
                  </div>
                  <div className="match-info">
                    <h4>{s.emoji} {s.name}</h4>
                    <p>{s.sector} · {s.stage} · Нужно {s.need}</p>
                    <div className="match-tags">
                      <span className="sc-tag">{s.sector.split(' / ')[0]}</span>
                      <span className="sc-tag">{s.stage}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16 }}>💰 Комиссия платформы</h3>
              <div className="commission-notice">
                Ставка комиссии: <strong>8%</strong> от суммы каждой сделки. Комиссия списывается автоматически при проведении сделки через платформу.
              </div>
              <div className="stat-box" style={{ marginTop: 16 }}>
                <div className="num">8%</div>
                <div className="lbl">фиксированная ставка</div>
              </div>
              <div style={{ background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.2)', borderRadius: 8, padding: '12px 16px', marginTop: 16, fontSize: '.84rem', color: 'var(--text-dim)' }}>
                ⚠️ <strong style={{ color: 'var(--red)' }}>Важно:</strong> Все сделки должны проводиться исключительно через платформу. Проведение сделок вне платформы является нарушением пользовательского соглашения.
              </div>
            </div>
          </div>
        </div>

        {/* Profile Panel */}
        <div className={`dash-panel ${activePanel === 'profile' ? 'active' : ''}`}>
          <div className="profile-header">
            <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #3498DB, #2980B9)' }}>РБ</div>
            <div className="profile-info">
              <h2>Рустам Бекмурзаев <span className="badge badge-green" style={{ marginLeft: 8, fontSize: '.7rem' }}>✅ Верифицирован</span></h2>
              <p>Инвестор · IT, Ритейл · Чек: ₽5–20М</p>
              <div className="profile-stats">
                <div className="pstat">
                  <div className="n">2</div>
                  <div className="l">сделки</div>
                </div>
                <div className="pstat">
                  <div className="n">₽42М</div>
                  <div className="l">инвестировано</div>
                </div>
                <div className="pstat">
                  <div className="n">4.9⭐</div>
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
                <select defaultValue="IT, Ритейл">
                  <option>IT, Ритейл</option>
                  <option>Финтех</option>
                  <option>Агротех</option>
                  <option>Логистика</option>
                  <option>Экология</option>
                </select>
              </div>
              <div className="form-group">
                <label>Размер чека</label>
                <select defaultValue="₽5–20М">
                  <option>₽1–5М</option>
                  <option>₽5–20М</option>
                  <option>₽20–50М</option>
                  <option>₽50М+</option>
                </select>
              </div>
              <div className="form-group">
                <label>Предпочтительная стадия</label>
                <select defaultValue="Pre-seed, Seed">
                  <option>Pre-seed</option>
                  <option>Seed</option>
                  <option>Pre-seed, Seed</option>
                  <option>Series A</option>
                </select>
              </div>
              <div className="form-group">
                <label>Регион</label>
                <select defaultValue="Чеченская Республика">
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
                <div style={{ padding: '16px', background: 'var(--dark3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span className="fw-600">ТехЧечня</span>
                    <span style={{ color: 'var(--gold)', fontSize: '.85rem' }}>★★★★★</span>
                  </div>
                  <p className="text-dim" style={{ fontSize: '.85rem', lineHeight: 1.6 }}>
                    Отличный инвестор! Быстро принял решение, помог с контактами и стратегией. Рекомендуем всем стартапам.
                  </p>
                </div>
                <div style={{ padding: '16px', background: 'var(--dark3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span className="fw-600">ГрозАгро</span>
                    <span style={{ color: 'var(--gold)', fontSize: '.85rem' }}>★★★★★</span>
                  </div>
                  <p className="text-dim" style={{ fontSize: '.85rem', lineHeight: 1.6 }}>
                    Профессиональный подход, глубокое понимание рынка. Инвестировал и активно помогает с развитием бизнеса.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verify Panel */}
        <div className={`dash-panel ${activePanel === 'verify' ? 'active' : ''}`}>
          <div style={{ background: 'rgba(46,204,113,.1)', border: '1px solid rgba(46,204,113,.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <div className="fw-600 text-green" style={{ marginBottom: 4 }}>Верификация пройдена</div>
              <div className="text-dim" style={{ fontSize: '.85rem' }}>
                ИП Бекмурзаев Р.А. · ОГРНИП: <span style={{ fontFamily: 'monospace' }}>321619600026782</span> · Дата верификации: 05.12.2024
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Процесс верификации</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(46,204,113,.15)', border: '1px solid rgba(46,204,113,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--green)', fontWeight: 700 }}>✓</div>
                <div>
                  <div className="fw-600" style={{ marginBottom: 4 }}>Шаг 1: Загрузка документов</div>
                  <div className="text-dim" style={{ fontSize: '.85rem' }}>Загрузите скан ИП/ООО, ОГРНИП/ОГРН и паспорт учредителя.</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(46,204,113,.15)', border: '1px solid rgba(46,204,113,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--green)', fontWeight: 700 }}>✓</div>
                <div>
                  <div className="fw-600" style={{ marginBottom: 4 }}>Шаг 2: Проверка администратором</div>
                  <div className="text-dim" style={{ fontSize: '.85rem' }}>Администратор проверяет документы в течение 1–2 рабочих дней.</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(46,204,113,.15)', border: '1px solid rgba(46,204,113,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--green)', fontWeight: 700 }}>✓</div>
                <div>
                  <div className="fw-600" style={{ marginBottom: 4 }}>Шаг 3: Получение статуса</div>
                  <div className="text-dim" style={{ fontSize: '.85rem' }}>Вы получаете статус верифицированного инвестора и доступ ко всем функциям.</div>
                </div>
              </div>
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

          {startups.map((s, i) => (
            <div className="ai-match-card" key={i} onClick={() => openModal('startupDetail')}>
              <div className="match-score" style={{ background: `conic-gradient(var(--gold) ${s.match}%, var(--dark3) 0)` }}>
                <span>{s.match}%</span>
              </div>
              <div className="match-info" style={{ flex: 1 }}>
                <h4>{s.emoji} {s.name}</h4>
                <p>{s.sector} · {s.stage} · Нужно {s.need} · ARR {s.arr}</p>
                <div className="match-tags">
                  <span className="sc-tag">{s.sector.split(' / ')[0]}</span>
                  <span className="sc-tag">{s.stage}</span>
                  <span className="sc-tag">ARR {s.arr}</span>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); showToast('NDA отправлено на подпись', '📝') }}>
                📝 NDA
              </button>
            </div>
          ))}
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

          <div className="grid-2">
            {filteredStartups.map((s, i) => (
              <div className="startup-card" key={i} onClick={() => openModal('startupDetail')}>
                <div className="sc-header">
                  <div className="sc-logo">{s.emoji}</div>
                  <div className="sc-info">
                    <h3>{s.name}</h3>
                    <p>{s.sector}</p>
                  </div>
                </div>
                <div className="sc-tags">
                  <span className="sc-tag">{s.stage}</span>
                  <span className="sc-tag">Нужно {s.need}</span>
                </div>
                <div className="sc-metrics">
                  <div className="sc-metric">
                    <div className="val">{s.arr}</div>
                    <div className="key">ARR</div>
                  </div>
                  <div className="sc-metric">
                    <div className="val">{s.need}</div>
                    <div className="key">Запрос</div>
                  </div>
                  <div className="sc-metric">
                    <div className="val" style={{ color: s.match >= 80 ? 'var(--green)' : 'var(--gold)' }}>{s.match}%</div>
                    <div className="key">Match</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`dash-panel ${activePanel === 'chat' ? 'active' : ''}`}>
          <div className="chat-layout">
            <div className="chat-list">
              <div className="chat-list-header">Сообщения</div>
              <div
                className={`chat-item ${activeChat === 'ТехЧечня' ? 'active' : ''}`}
                onClick={() => setActiveChat('ТехЧечня')}
              >
                <div className="chat-item-name">🚀 ТехЧечня</div>
                <div className="chat-item-preview">Конечно! Мы работаем по модели...</div>
                <div className="chat-item-time">10:34</div>
              </div>
              <div
                className={`chat-item ${activeChat === 'ГрозАгро' ? 'active' : ''}`}
                onClick={() => setActiveChat('ГрозАгро')}
              >
                <div className="chat-item-name">🌾 ГрозАгро</div>
                <div className="chat-item-preview">Спасибо за инвестицию!</div>
                <div className="chat-item-time">Вчера</div>
              </div>
            </div>
            <div className="chat-main">
              <div className="chat-header">
                <div className="avatar" style={{ width: 32, height: 32, fontSize: '.8rem' }}>
                  {activeChat === 'ТехЧечня' ? '🚀' : '🌾'}
                </div>
                <div>
                  <div className="fw-600">{activeChat}</div>
                  <div className="text-dim" style={{ fontSize: '.75rem' }}>Онлайн</div>
                </div>
              </div>
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div className={`msg ${msg.mine ? 'mine' : 'theirs'}`} key={i}>
                    <div className="msg-bubble">{msg.text}</div>
                    <div className="msg-time">{msg.time}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  className="chat-input"
                  placeholder="Написать сообщение..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                />
                <button className="chat-send" onClick={sendMsg}>➤</button>
              </div>
            </div>
          </div>
        </div>

        {/* Events Panel */}
        <div className={`dash-panel ${activePanel === 'events' ? 'active' : ''}`}>
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
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('Вы зарегистрированы!', '✅')}>
                      Участвовать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals Panel */}
        <div className={`dash-panel ${activePanel === 'deals' ? 'active' : ''}`}>
          <div className="commission-notice">
            Комиссия платформы: <strong>8%</strong> от суммы каждой сделки. Все сделки проводятся через безопасный эскроу-счёт WayInvest.
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>История сделок</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Стартап</th>
                  <th>Сумма</th>
                  <th>Комиссия 8%</th>
                  <th>Итого</th>
                  <th>Дата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-600">🚀 ТехЧечня</td>
                  <td>₽15М</td>
                  <td className="text-gold fw-600">₽1.2М</td>
                  <td className="fw-600">₽16.2М</td>
                  <td>01.11.2024</td>
                  <td><span className="badge badge-green">Завершена</span></td>
                </tr>
                <tr>
                  <td className="fw-600">🌾 ГрозАгро</td>
                  <td>₽27М</td>
                  <td className="text-gold fw-600">₽2.16М</td>
                  <td className="fw-600">₽29.16М</td>
                  <td>15.09.2024</td>
                  <td><span className="badge badge-green">Завершена</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-gold" onClick={() => openModal('newDeal')}>
              + Инициировать новую сделку
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
