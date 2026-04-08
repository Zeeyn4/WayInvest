'use client'

import { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { useRouter } from 'next/navigation'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Home() {
  const [mobileNav, setMobileNav] = useState(false)
  const { openModal } = useApp()
  const router = useRouter()

  return (
    <div>
      {/* NAV */}
      <div style={{position:'relative'}}>
      <nav className="nav">
        <div className="nav-logo" onClick={() => window.scrollTo(0, 0)} style={{ cursor: 'pointer' }}>
          Lam<span>Invest</span>
        </div>
        <div className="nav-links">
          <a className="nav-link" onClick={() => scrollTo('about')}>О платформе</a>
          <a className="nav-link" onClick={() => scrollTo('packages')}>Тарифы</a>
          <a className="nav-link" onClick={() => scrollTo('how')}>Как это работает</a>
          <a className="nav-link" onClick={() => scrollTo('safety')}>Безопасность</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-outline btn-sm" onClick={() => openModal('login')}>Войти</button>
          <button className="btn btn-gold btn-sm" onClick={() => openModal('register')}>Регистрация</button>
        </div>
        <button className="burger-btn" onClick={() => setMobileNav(!mobileNav)}>
          {mobileNav ? '✕' : '☰'}
        </button>
      </nav>
      <div className={`nav-mobile${mobileNav ? ' active' : ''}`}>
        <a className="nav-link" onClick={() => { scrollTo('about'); setMobileNav(false) }}>О платформе</a>
        <a className="nav-link" onClick={() => { scrollTo('packages'); setMobileNav(false) }}>Тарифы</a>
        <a className="nav-link" onClick={() => { scrollTo('how'); setMobileNav(false) }}>Как это работает</a>
        <a className="nav-link" onClick={() => { scrollTo('safety'); setMobileNav(false) }}>Безопасность</a>
        <button className="btn btn-outline btn-sm" style={{width:'100%'}} onClick={() => { openModal('login'); setMobileNav(false) }}>Войти</button>
        <button className="btn btn-gold btn-sm" style={{width:'100%'}} onClick={() => { openModal('register'); setMobileNav(false) }}>Регистрация</button>
      </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-lines"></div>
        <div className="hero-badge">🇷🇺 Первая инвест-платформа регионального рынка</div>
        <h1>Первая инвест-платформа<br />регионального рынка</h1>
        <p>LamInvest соединяет перспективные стартапы с верифицированными инвесторами. Безопасные сделки, AI-подбор партнёров, защита от мошенничества.</p>
        <div className="hero-btns">
          <button className="btn btn-gold" onClick={() => openModal('register')} style={{ fontSize: '1rem', padding: '14px 36px' }}>Разместить стартап</button>
          <button className="btn btn-outline" onClick={() => openModal('register')} style={{ fontSize: '1rem', padding: '14px 36px' }}>Я инвестор</button>
        </div>
        <div style={{ marginTop: 60, display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: 'var(--gold)', fontWeight: 700 }}>8%</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '.8rem' }}>Комиссия платформы</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: 'var(--gold)', fontWeight: 700 }}>0₽</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '.8rem' }}>Размещение стартапа</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: 'var(--gold)', fontWeight: 700 }}>NDA</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '.8rem' }}>Защита идей</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: 'var(--gold)', fontWeight: 700 }}>AI</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '.8rem' }}>Умный подбор</div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <div id="about" style={{ background: 'var(--dark2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section">
          <div className="section-title">Как работает LamInvest</div>
          <div className="divider"></div>
          <div className="grid-3">
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Регистрация и верификация</h3>
              <p>Стартапы регистрируются бесплатно. Инвесторы проходят обязательную проверку документов ИП или юрлица — только после этого они могут инвестировать.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-подбор партнёров</h3>
              <p>Интеллектуальный алгоритм анализирует профили участников и предлагает наиболее релевантные совпадения по отрасли, сумме и стадии развития.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Безопасная сделка</h3>
              <p>Все инвестиции проходят через платформу. Комиссия 8% фиксирована. Любые обходные договорённости являются нарушением соглашения и ведут к блокировке.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Встроенные коммуникации</h3>
              <p>Личные чаты, групповые каналы, онлайн-питч-сессии — все переговоры ведутся внутри платформы с полным логированием действий.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Автоматическое NDA</h3>
              <p>Перед просмотром деталей стартапа инвестор подписывает соглашение о неразглашении. Презентации защищены водяными знаками.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Мероприятия и питч-сессии</h3>
              <p>Регулярные онлайн-события: вебинары, мастер-классы и питч-сессии для стартапов и инвесторов с возможностью записи через профиль.</p>
            </div>
          </div>
        </div>
      </div>

      {/* PACKAGES */}
      <div id="packages">
        <div className="section">
          <div className="section-title">Тарифы для стартапов</div>
          <div className="section-sub">Размещение на платформе бесплатно. Дополнительные пакеты помогают стартапам привлечь внимание инвесторов быстрее.</div>
          <div className="commission-notice">⚠️ <strong>Важно:</strong> При совершении инвестиционной сделки через LamInvest с суммы инвестиций удерживается комиссия платформы <strong>8%</strong>. Данный размер комиссии является фиксированным, закреплён в Пользовательском соглашении и не может быть изменён или оспорен ни инвестором, ни стартапом.</div>
          <div className="grid-4" style={{ alignItems: 'start' }}>
            {/* Базовый */}
            <div className="pkg-card" onClick={() => openModal('package')}>
              <div className="pkg-name">Базовый</div>
              <div className="pkg-price">0₽<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Профиль стартапа</li>
                <li>Базовое описание проекта</li>
                <li>Доступ к каталогу инвесторов</li>
                <li>Получение откликов</li>
                <li className="no">Приоритет в поиске</li>
                <li className="no">Расширенная аналитика</li>
                <li className="no">AI-подбор инвесторов</li>
                <li className="no">Консультации и NDA</li>
              </ul>
              <button className="btn btn-outline" style={{ width: '100%' }}>Начать бесплатно</button>
            </div>
            {/* Стартовый */}
            <div className="pkg-card" onClick={() => openModal('package')}>
              <div className="pkg-name">Стартовый</div>
              <div className="pkg-price">4 900₽<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Всё из Базового</li>
                <li>Приоритет в поиске</li>
                <li>Расширенная аналитика просмотров</li>
                <li>AI-подбор инвесторов</li>
                <li>Статистика интереса</li>
                <li className="no">Индивидуальная консультация</li>
                <li className="no">Помощь с документами</li>
                <li className="no">Усиленная защита NDA</li>
              </ul>
              <button className="btn btn-outline" style={{ width: '100%' }}>Выбрать</button>
            </div>
            {/* Премиум */}
            <div className="pkg-card featured" onClick={() => openModal('package')}>
              <div className="pkg-badge">ПОПУЛЯРНЫЙ</div>
              <div className="pkg-name">Премиум</div>
              <div className="pkg-price">12 900₽<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Всё из Стартового</li>
                <li>Индивидуальная консультация</li>
                <li>Помощь в оформлении документов</li>
                <li>NDA + водяные знаки</li>
                <li>Ограниченный доступ к файлам</li>
                <li>Высший приоритет AI-подбора</li>
              </ul>
              <button className="btn btn-gold" style={{ width: '100%' }}>Выбрать Премиум</button>
            </div>
            {/* Элит */}
            <div className="pkg-card" onClick={() => openModal('package')}>
              <div className="pkg-name">Элит</div>
              <div className="pkg-price">29 900₽<span>/мес</span></div>
              <ul className="pkg-features">
                <li>Всё из Премиум</li>
                <li>Персональный менеджер</li>
                <li>Участие в закрытых питч-сессиях</li>
                <li>Featured-размещение на главной</li>
                <li>Прямой выход на топ-инвесторов</li>
                <li>Юридическое сопровождение сделки</li>
              </ul>
              <button className="btn btn-outline" style={{ width: '100%' }}>Выбрать Элит</button>
            </div>
          </div>
        </div>
      </div>

      {/* SAFETY */}
      <div id="safety" style={{ background: 'var(--dark2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section">
          <div className="section-title">Безопасность и защита</div>
          <div className="divider"></div>
          <div className="grid-2">
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>🔐 Верификация инвесторов</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.6 }}>Каждый инвестор обязан предоставить документы ИП или юридического лица. До прохождения проверки администратором — <strong style={{ color: 'var(--text)' }}>нет доступа к стартапам, нет возможности писать или инвестировать</strong>.</p>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>📝 Автоматическое NDA</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.6 }}>Перед просмотром детальных материалов стартапа инвестор подтверждает соглашение о неразглашении. Все просмотры логируются с указанием IP и времени.</p>
              </div>
              <div className="card">
                <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>🚫 Запрет обходных сделок</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.6 }}>Сделки вне платформы запрещены. Попытка обойти комиссию 8% является нарушением соглашения и ведёт к немедленной <strong style={{ color: 'var(--red)' }}>блокировке профиля</strong>.</p>
              </div>
            </div>
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>💧 Защита презентаций</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.6 }}>Все загружённые материалы стартапа отображаются с персональными водяными знаками. Скачивание в полном виде невозможно до стадии глубокой сделки.</p>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>📊 Журнал действий</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.6 }}>Стартап видит полный список инвесторов, которые просматривали его материалы: кто, когда, сколько времени провёл на каждом разделе.</p>
              </div>
              <div className="card">
                <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>🏦 Фиксированная комиссия 8%</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.6 }}>Комиссия платформы закреплена в Пользовательском соглашении. Её размер не подлежит обсуждению или изменению. Инвестор уведомляется об этом при регистрации.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW */}
      <div id="how">
        <div className="section">
          <div className="section-title">Для стартапов и инвесторов</div>
          <div className="divider"></div>
          <div className="grid-2" style={{ gap: 40 }}>
            {/* Startup side */}
            <div>
              <h3 style={{ color: 'var(--gold)', fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', marginBottom: 20 }}>🚀 Если вы стартап</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { n: '1', title: 'Зарегистрируйтесь бесплатно', desc: 'Создайте профиль команды и проекта. Загрузите питч-дек и финансовые показатели.' },
                  { n: '2', title: 'Получайте отклики от инвесторов', desc: 'AI-алгоритм подбирает релевантных инвесторов под ваш профиль и запросы.' },
                  { n: '3', title: 'Ведите переговоры в чате', desc: 'Все коммуникации — внутри платформы. История переписки защищена и документируется.' },
                  { n: '4', title: 'Закройте сделку через LamInvest', desc: 'Инвестиция проходит через платформу. Сделка официально зафиксирована и защищена.' },
                ].map((s) => (
                  <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,168,76,.15)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', color: 'var(--gold)', flexShrink: 0, fontWeight: 700 }}>{s.n}</div>
                    <div><strong>{s.title}</strong><br /><span style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>{s.desc}</span></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <button className="btn btn-gold" onClick={() => openModal('register')}>Разместить стартап →</button>
              </div>
            </div>
            {/* Investor side */}
            <div>
              <h3 style={{ color: 'var(--gold)', fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', marginBottom: 20 }}>💼 Если вы инвестор</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { n: '1', title: 'Пройдите верификацию', desc: 'Загрузите документы ИП или юрлица. Администратор проверит данные в течение 1–2 рабочих дней.' },
                  { n: '2', title: 'Заполните инвестиционный профиль', desc: 'Укажите отраслевые интересы, инвестиционный чек, стадии и регион поиска.' },
                  { n: '3', title: 'Изучайте стартапы через AI', desc: 'Получайте персональные рекомендации. Просматривайте материалы под защитой NDA.' },
                  { n: '4', title: 'Инвестируйте через платформу', desc: 'Комиссия 8% удерживается платформой автоматически при проведении сделки через LamInvest.' },
                ].map((s) => (
                  <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,168,76,.15)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', color: 'var(--gold)', flexShrink: 0, fontWeight: 700 }}>{s.n}</div>
                    <div><strong>{s.title}</strong><br /><span style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>{s.desc}</span></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <button className="btn btn-outline" onClick={() => openModal('register')}>Стать инвестором →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-logo">Lam<span>Invest</span></div>
            <p className="footer-desc">Первая инвест-платформа регионального рынка. Безопасные сделки между стартапами и верифицированными инвесторами.</p>
            <div style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: '.8rem' }}>📍 Грозный, Чеченская Республика</div>
          </div>
          <div className="footer-col">
            <h4>Платформа</h4>
            <a onClick={() => openModal('register')}>Разместить стартап</a>
            <a onClick={() => openModal('register')}>Стать инвестором</a>
            <a onClick={() => openModal('login')}>Мероприятия</a>
            <a onClick={() => openModal('login')}>Каталог стартапов</a>
          </div>
          <div className="footer-col">
            <h4>Компания</h4>
            <a onClick={() => openModal('terms')}>Правила сервиса</a>
            <a onClick={() => openModal('terms')}>Пользовательское соглашение</a>
            <a onClick={() => openModal('terms')}>Политика конфиденциальности</a>
            <a onClick={() => openModal('terms')}>Комиссия и оплата</a>
          </div>
          <div className="footer-col">
            <h4>Поддержка</h4>
            <a>support@wayinvest.ru</a>
            <a>+7 (928) 000-00-00</a>
            <a>Telegram-чат</a>
            <a>FAQ</a>
          </div>
        </div>
        <div className="footer-bottom">© 2026 LamInvest. Все права защищены. Комиссия платформы 8% фиксирована и не подлежит изменению.</div>
      </footer>
    </div>
  )
}
