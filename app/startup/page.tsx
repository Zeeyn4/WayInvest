'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { investors, events, aiScores } from '@/lib/data'

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
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, text: 'Здравствуйте! Я ознакомился с вашим проектом ТехЧечня. Очень интересная концепция маркетплейса.', mine: false, time: '14:22' },
    { id: 2, text: 'Спасибо! Рады, что проект привлёк ваше внимание. Готовы ответить на любые вопросы.', mine: true, time: '14:25' },
    { id: 3, text: 'Какая у вас текущая юнит-экономика? Интересует CAC и LTV.', mine: false, time: '14:28' },
    { id: 4, text: 'CAC сейчас ₽340, LTV ₽4,200. Соотношение LTV/CAC = 12.3x. Подробнее в нашей фин.модели.', mine: true, time: '14:31' },
  ])
  const [catalogFilter, setCatalogFilter] = useState('Все')
  const [activeChat, setActiveChat] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { openModal } = useApp()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMsg = () => {
    if (!chatInput.trim()) return
    const newMsg = { id: Date.now(), text: chatInput, mine: true, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, newMsg])
    setChatInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Спасибо за информацию! Давайте обсудим детали на встрече.',
        mine: false,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      }])
    }, 1200)
  }

  const chatList = [
    { name: 'Рустам Бекмурзаев', preview: 'CAC сейчас ₽340, LTV ₽4,200...', time: '14:31', active: true },
    { name: 'Магомед Ахматов', preview: 'Когда можно посмотреть демо?', time: 'Вчера', active: false },
    { name: 'Зулай Алиева', preview: 'Отправила NDA на подпись', time: 'Вт', active: false },
    { name: 'IT Стартапы ЧР', preview: 'Алихан: Кто идёт на питч-день?', time: 'Пн', active: false },
  ]

  const filters = ['Все', 'IT', 'Ритейл', 'Финтех', 'Pre-seed', 'Seed']

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => router.push('/')}>Way<span>Invest</span></div>

        <div className="sidebar-section">Основное</div>
        <div className={`sidebar-item${activePanel === 'dashboard' ? ' active' : ''}`} onClick={() => setActivePanel('dashboard')}>
          <span className="icon">📊</span> Дашборд
        </div>
        <div className={`sidebar-item${activePanel === 'profile' ? ' active' : ''}`} onClick={() => setActivePanel('profile')}>
          <span className="icon">👤</span> Мой профиль
        </div>
        <div className={`sidebar-item${activePanel === 'project' ? ' active' : ''}`} onClick={() => setActivePanel('project')}>
          <span className="icon">📁</span> Мой проект
        </div>

        <div className="sidebar-section">Инвесторы</div>
        <div className={`sidebar-item${activePanel === 'aiMatch' ? ' active' : ''}`} onClick={() => setActivePanel('aiMatch')}>
          <span className="icon">🤖</span> AI-подбор
        </div>
        <div className={`sidebar-item${activePanel === 'catalog' ? ' active' : ''}`} onClick={() => setActivePanel('catalog')}>
          <span className="icon">📋</span> Каталог инвесторов
        </div>

        <div className="sidebar-section">Коммуникации</div>
        <div className={`sidebar-item${activePanel === 'chat' ? ' active' : ''}`} onClick={() => setActivePanel('chat')}>
          <span className="icon">💬</span> Чаты
        </div>
        <div className={`sidebar-item${activePanel === 'events' ? ' active' : ''}`} onClick={() => setActivePanel('events')}>
          <span className="icon">📅</span> Мероприятия
        </div>

        <div className="sidebar-section">Настройки</div>
        <div className={`sidebar-item${activePanel === 'tariff' ? ' active' : ''}`} onClick={() => setActivePanel('tariff')}>
          <span className="icon">💎</span> Тариф
        </div>
        <div className={`sidebar-item${activePanel === 'docs' ? ' active' : ''}`} onClick={() => setActivePanel('docs')}>
          <span className="icon">📄</span> Документы
        </div>

        <div style={{ padding: '20px 24px', marginTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => router.push('/')}>
            🚪 Выйти
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="dash-main">
        <div className="dash-header">
          <h1>{panelTitles[activePanel]}</h1>
          <div className="dash-user">
            <button className="notif-btn">🔔<span className="notif-dot"></span></button>
            <div className="avatar">ТЧ</div>
            <span style={{ fontSize: '.9rem' }}>ТехЧечня</span>
          </div>
        </div>

        {/* ===== DASHBOARD ===== */}
        <div className={`dash-panel${activePanel === 'dashboard' ? ' active' : ''}`}>
          <div style={{ background: 'linear-gradient(135deg, rgba(46,204,113,.15), rgba(46,204,113,.05))', border: '1px solid rgba(46,204,113,.3)', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.3rem' }}>✨</span>
            <div>
              <strong style={{ color: 'var(--green)' }}>Тариф: Стартовый</strong>
              <span style={{ color: 'var(--text-dim)', fontSize: '.85rem', marginLeft: '12px' }}>Активен до 15.03.2025</span>
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <div className="stat-box">
              <div className="num">247</div>
              <div className="lbl">просмотров</div>
            </div>
            <div className="stat-box">
              <div className="num">18</div>
              <div className="lbl">откликов</div>
            </div>
            <div className="stat-box">
              <div className="num">5</div>
              <div className="lbl">переговоров</div>
            </div>
            <div className="stat-box">
              <div className="num">82%</div>
              <div className="lbl">AI рейтинг</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>📈 Интерес инвесторов</h3>
              {[
                { label: 'Просмотры профиля', val: 78 },
                { label: 'Скачивание PitchDeck', val: 54 },
                { label: 'Запросы на встречу', val: 32 },
                { label: 'Повторные просмотры', val: 45 },
              ].map((item, i) => (
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
              {[
                { name: 'Рустам Бекмурзаев', text: 'Интересует ваш проект. Готов обсудить инвестиции.', time: '2 часа назад', badge: 'badge-green', badgeText: 'Новый' },
                { name: 'Магомед Ахматов', text: 'Хочу посмотреть демо продукта.', time: '5 часов назад', badge: 'badge-blue', badgeText: 'В работе' },
                { name: 'Зулай Алиева', text: 'Отправила запрос на NDA.', time: 'Вчера', badge: 'badge-gold', badgeText: 'NDA' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex-between">
                    <span className="fw-600" style={{ fontSize: '.9rem' }}>{item.name}</span>
                    <span className={`badge ${item.badge}`}>{item.badgeText}</span>
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '.83rem', margin: '6px 0 4px' }}>{item.text}</p>
                  <span style={{ color: 'var(--text-dim)', fontSize: '.72rem' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PROFILE ===== */}
        <div className={`dash-panel${activePanel === 'profile' ? ' active' : ''}`}>
          <div className="profile-header">
            <div className="profile-avatar">🚀</div>
            <div className="profile-info">
              <h2>ТехЧечня</h2>
              <p>IT / Маркетплейс &bull; <span className="badge badge-gold" style={{ marginLeft: '4px' }}>Pre-seed</span></p>
              <div className="profile-stats">
                <div className="pstat"><div className="n">38</div><div className="l">месяцев</div></div>
                <div className="pstat"><div className="n">1 200</div><div className="l">users</div></div>
                <div className="pstat"><div className="n">₽4.2М</div><div className="l">ARR</div></div>
                <div className="pstat"><div className="n">4.8⭐</div><div className="l">рейтинг</div></div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>✏️ Редактировать профиль</h3>
              <div className="form-group">
                <label>Название проекта</label>
                <input type="text" defaultValue="ТехЧечня" />
              </div>
              <div className="form-group">
                <label>Сектор</label>
                <select defaultValue="IT / Маркетплейс">
                  <option>IT / Маркетплейс</option>
                  <option>Финтех</option>
                  <option>Агротех</option>
                  <option>Логистика</option>
                  <option>Ритейл</option>
                </select>
              </div>
              <div className="form-group">
                <label>Стадия</label>
                <select defaultValue="Pre-seed">
                  <option>Pre-seed</option>
                  <option>Seed</option>
                  <option>Раунд A</option>
                  <option>Раунд B</option>
                </select>
              </div>
              <div className="form-group">
                <label>Потребность в инвестициях</label>
                <input type="text" defaultValue="₽10М" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea defaultValue="Маркетплейс локальных товаров и услуг Чеченской Республики с AI-рекомендациями и интегрированной логистикой." />
              </div>
              <button className="btn btn-gold">Сохранить</button>
            </div>

            <div>
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>👥 Команда</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', padding: '12px', background: 'var(--dark3)', borderRadius: '10px' }}>
                  <div className="avatar">АМ</div>
                  <div>
                    <div className="fw-600" style={{ fontSize: '.9rem' }}>Алихан Мусаев</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '.8rem' }}>CEO &bull; Основатель</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--dark3)', borderRadius: '10px' }}>
                  <div className="avatar">ЛА</div>
                  <div>
                    <div className="fw-600" style={{ fontSize: '.9rem' }}>Лейла Абдулаева</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '.8rem' }}>CTO &bull; Технический директор</div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm mt-16" style={{ width: '100%' }}>+ Добавить участника</button>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>🏷️ Теги</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Маркетплейс', 'AI', 'Логистика', 'B2C', 'Чечня', 'Pre-seed'].map(tag => (
                    <span key={tag} className="badge badge-gold">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== PROJECT ===== */}
        <div className={`dash-panel${activePanel === 'project' ? ' active' : ''}`}>
          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>📎 Загруженные материалы</h3>
              {[
                { icon: '📊', name: 'PitchDeck_TechChechnya_v3.pdf', size: '2.4 МБ', date: '10.12.2024' },
                { icon: '📈', name: 'Фин.модель_2024.xlsx', size: '1.1 МБ', date: '08.12.2024' },
                { icon: '📄', name: 'Устав_ООО_ТехЧечня.pdf', size: '340 КБ', date: '01.12.2024' },
              ].map((file, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'var(--dark3)', borderRadius: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{file.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="fw-600" style={{ fontSize: '.88rem' }}>{file.name}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '.75rem' }}>{file.size} &bull; {file.date}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm">👁️</button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm mt-16" style={{ width: '100%' }}>+ Загрузить документ</button>
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
                    {[
                      { inv: 'Рустам Б.', doc: 'PitchDeck', date: '12.12.2024' },
                      { inv: 'Магомед А.', doc: 'Фин.модель', date: '11.12.2024' },
                      { inv: 'Зулай А.', doc: 'PitchDeck', date: '10.12.2024' },
                      { inv: 'Рустам Б.', doc: 'Фин.модель', date: '10.12.2024' },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.inv}</td>
                        <td>{row.doc}</td>
                        <td style={{ color: 'var(--text-dim)' }}>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="nda-overlay">
                <div className="nda-icon">🔒</div>
                <h3>Защита NDA</h3>
                <p>Все документы защищены водяными знаками и доступны только верифицированным инвесторам после подписания NDA.</p>
                <button className="btn btn-gold btn-sm">Настроить доступ</button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== AI MATCH ===== */}
        <div className={`dash-panel${activePanel === 'aiMatch' ? ' active' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>🤖 AI рекомендации для ТехЧечня</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Алгоритм проанализировал 147 инвесторов и подобрал лучших</p>
            </div>
            <button className="btn btn-outline btn-sm">🔄 Обновить</button>
          </div>

          {investors.map((inv, i) => (
            <div key={i} className="ai-match-card">
              <div
                className="match-score"
                style={{
                  background: `conic-gradient(var(--gold) ${aiScores[i] * 3.6}deg, var(--dark3) 0deg)`,
                }}
              >
                <span>{aiScores[i]}%</span>
              </div>
              <div className="match-info">
                <h4>{inv.name}</h4>
                <p>{inv.focus} &bull; {inv.check} &bull; {inv.stage}</p>
                <div className="match-tags">
                  {inv.focus.split(', ').map(tag => (
                    <span key={tag} className="badge badge-gold">{tag}</span>
                  ))}
                  <span className="badge badge-green">{inv.status}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: 'var(--gold)', fontSize: '.8rem', marginBottom: '8px' }}>⭐ {inv.rating}</div>
                <button className="btn btn-gold btn-sm">Связаться</button>
              </div>
            </div>
          ))}
        </div>

        {/* ===== CATALOG ===== */}
        <div className={`dash-panel${activePanel === 'catalog' ? ' active' : ''}`}>
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
            {investors.map((inv, i) => (
              <div key={i} className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>{inv.name.split(' ').map(w => w[0]).join('')}</div>
                  <div>
                    <div className="fw-600">{inv.name}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '.82rem' }}>{inv.focus}</div>
                  </div>
                  <span className="badge badge-green" style={{ marginLeft: 'auto' }}>{inv.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {inv.focus.split(', ').map(tag => (
                    <span key={tag} className="badge badge-gold">{tag}</span>
                  ))}
                  {inv.stage.split(', ').map(tag => (
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
                  <button className="btn btn-outline btn-sm">Подробнее</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CHAT ===== */}
        <div className={`dash-panel${activePanel === 'chat' ? ' active' : ''}`}>
          <div className="chat-layout">
            <div className="chat-list">
              <div className="chat-list-header">💬 Сообщения</div>
              {chatList.map((c, i) => (
                <div
                  key={i}
                  className={`chat-item${activeChat === i ? ' active' : ''}`}
                  onClick={() => setActiveChat(i)}
                >
                  <div className="chat-item-name">{c.name}</div>
                  <div className="chat-item-preview">{c.preview}</div>
                  <div className="chat-item-time">{c.time}</div>
                </div>
              ))}
            </div>
            <div className="chat-main">
              <div className="chat-header">
                <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '.8rem' }}>РБ</div>
                <div>
                  <div className="fw-600" style={{ fontSize: '.9rem' }}>Рустам Бекмурзаев</div>
                  <div style={{ color: 'var(--green)', fontSize: '.75rem' }}>● Онлайн</div>
                </div>
              </div>
              <div className="chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`msg${msg.mine ? ' mine' : ' theirs'}`}>
                    <div className="msg-bubble">{msg.text}</div>
                    <div className="msg-time">{msg.time}</div>
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
            </div>
          </div>
        </div>

        {/* ===== EVENTS ===== */}
        <div className={`dash-panel${activePanel === 'events' ? ' active' : ''}`}>
          <div className="grid-2">
            {events.map((ev, i) => (
              <div key={i} className="event-card">
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
            ))}
          </div>
        </div>

        {/* ===== TARIFF ===== */}
        <div className={`dash-panel${activePanel === 'tariff' ? ' active' : ''}`}>
          <div className="commission-notice">
            <strong>Комиссия платформы: 8%</strong> от суммы сделки взимается только при успешном закрытии инвестиционного раунда. Никаких скрытых платежей.
          </div>

          <div className="grid-4">
            <div className="pkg-card">
              <div className="pkg-name">Базовый</div>
              <div className="pkg-price">Бесплатно</div>
              <ul className="pkg-features">
                <li>Профиль стартапа</li>
                <li>1 документ</li>
                <li>Базовый AI-скоринг</li>
                <li className="no">Чат с инвесторами</li>
                <li className="no">Приоритет в выдаче</li>
              </ul>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} disabled>Текущий</button>
            </div>

            <div className="pkg-card featured">
              <div className="pkg-badge">ВЫ ЗДЕСЬ</div>
              <div className="pkg-name">Стартовый</div>
              <div className="pkg-price">₽4 990<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Всё из Базового</li>
                <li>5 документов</li>
                <li>AI-подбор инвесторов</li>
                <li>Чат с инвесторами</li>
                <li className="no">Приоритет в выдаче</li>
              </ul>
              <button className="btn btn-gold btn-sm" style={{ width: '100%' }} disabled>Активен</button>
            </div>

            <div className="pkg-card">
              <div className="pkg-name">Премиум</div>
              <div className="pkg-price">₽14 990<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Всё из Стартового</li>
                <li>Безлимит документов</li>
                <li>Приоритет в выдаче</li>
                <li>Персональный менеджер</li>
                <li>Аналитика просмотров</li>
              </ul>
              <button className="btn btn-gold btn-sm" style={{ width: '100%' }} onClick={() => openModal('upgrade')}>Перейти</button>
            </div>

            <div className="pkg-card">
              <div className="pkg-name">Элит</div>
              <div className="pkg-price">₽49 990<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Всё из Премиум</li>
                <li>Питч перед инвесторами</li>
                <li>Юридическое сопровождение</li>
                <li>Due Diligence помощь</li>
                <li>VIP нетворкинг</li>
              </ul>
              <button className="btn btn-gold btn-sm" style={{ width: '100%' }} onClick={() => openModal('upgrade')}>Перейти</button>
            </div>
          </div>
        </div>

        {/* ===== DOCS ===== */}
        <div className={`dash-panel${activePanel === 'docs' ? ' active' : ''}`}>
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
                  <tr>
                    <td>Рустам Б.</td>
                    <td>10.12.2024</td>
                    <td><span className="badge badge-green">Подписан</span></td>
                  </tr>
                  <tr>
                    <td>Магомед А.</td>
                    <td>08.12.2024</td>
                    <td><span className="badge badge-green">Подписан</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
