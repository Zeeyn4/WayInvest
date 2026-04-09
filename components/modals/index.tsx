'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { registerStartup, registerInvestor, loginUser, saveStartupRequisitesAfterSignup, sendEmailCode, verifyEmailCode } from '@/actions/auth.actions'

/* ------------------------------------------------------------------ */
/*  Password input with toggle                                         */
/* ------------------------------------------------------------------ */
function PasswordInput({ name = 'password', placeholder = '••••••••', required = true, minLength }: { name?: string; placeholder?: string; required?: boolean; minLength?: number }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input name={name} type={show ? 'text' : 'password'} placeholder={placeholder} required={required} minLength={minLength} style={{ paddingRight: 44 }} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared overlay wrapper                                             */
/* ------------------------------------------------------------------ */
function Overlay({ id, children, style }: { id: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const { activeModal, closeModal } = useApp()
  return (
    <div
      className={`modal-overlay${activeModal === id ? ' active' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className="modal" style={style}>
        <button className="modal-close" onClick={() => closeModal()}>✕</button>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  1. LOGIN                                                           */
/* ------------------------------------------------------------------ */
function LoginModal() {
  const { closeModal, openModal, showToast } = useApp()
  const router = useRouter()
  const roles = ['Стартап', 'Инвестор', 'Администратор'] as const
  const [tab, setTab] = useState(0)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleLogin() {
    setError('')
    const form = document.getElementById('loginForm') as HTMLFormElement
    if (!form) return
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await loginUser(formData)
      if (!result.success) {
        setError(result.error || 'Ошибка входа')
        return
      }
      closeModal()
      showToast('Добро пожаловать в LamInvest!', '👋')
      router.push(result.redirect || '/')
      router.refresh()
    })
  }

  return (
    <Overlay id="login">
      <h2>Войти в LamInvest</h2>
      <div className="tabs">
        {roles.map((r, i) => (
          <button key={r} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{r}</button>
        ))}
      </div>
      <form id="loginForm" onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
        <div className="form-group"><label>Email</label><input name="email" type="email" placeholder="example@mail.ru" required /></div>
        <div className="form-group"><label>Пароль</label><PasswordInput /></div>
        {error && <div style={{ color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>{error}</div>}
        <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} disabled={isPending}>
          {isPending ? 'Входим...' : 'Войти'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-dim)', fontSize: '.85rem' }}>
        Нет аккаунта?{' '}
        <a style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={() => { closeModal(); openModal('register') }}>Зарегистрироваться</a>
      </div>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  2. REGISTER                                                        */
/* ------------------------------------------------------------------ */
function RegisterModal() {
  const { closeModal, openModal, showToast } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [step, setStep] = useState<'form' | 'code' | 'startupRequisites'>('form')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [savedEmail, setSavedEmail] = useState('')
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null)
  const [code, setCode] = useState('')
  const [startupReq, setStartupReq] = useState({
    phone: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  })

  function resetState() {
    setStep('form')
    setError('')
    setCode('')
    setSavedEmail('')
    setSavedFormData(null)
    setStartupReq({
      phone: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
    })
  }

  // Step 1: Validate form & send code
  function handleSendCode(formType: 'startup' | 'investor') {
    setError('')
    const formId = formType === 'startup' ? 'regStartupForm' : 'regInvestorForm'
    const form = document.getElementById(formId) as HTMLFormElement
    if (!form || !form.checkValidity()) { form?.reportValidity(); return }

    const formData = new FormData(form)
    const email = formData.get('email') as string
    setSavedEmail(email)
    setSavedFormData(formData)

    startTransition(async () => {
      const result = await sendEmailCode(email)
      if (!result.success) {
        setError(result.error || 'Ошибка отправки кода')
        return
      }
      setStep('code')
      showToast(`Код отправлен на ${email}`, '📧')
    })
  }

  // Step 2: Verify code & register
  function handleVerifyAndRegister(formType: 'startup' | 'investor') {
    setError('')
    if (code.length !== 6) { setError('Введите 6-значный код'); return }
    if (!savedFormData) { setError('Данные формы потеряны. Начните заново.'); return }

    startTransition(async () => {
      // Verify code
      const verifyResult = await verifyEmailCode(savedEmail, code)
      if (!verifyResult.success) {
        setError(verifyResult.error || 'Неверный код')
        return
      }

      // Register using saved form data
      const result = formType === 'startup'
        ? await registerStartup(savedFormData)
        : await registerInvestor(savedFormData)

      if (!result.success) {
        setError(result.error || 'Ошибка регистрации')
        return
      }

      if (formType === 'startup') {
        setStep('startupRequisites')
        showToast('Email подтвержден. Заполните реквизиты стартапа.', '🏦')
      } else {
        closeModal()
        resetState()
        showToast('Регистрация прошла успешно!', '📋')
        router.push(result.redirect || '/')
        router.refresh()
      }
    })
  }

  // Resend code
  function handleResend() {
    startTransition(async () => {
      const result = await sendEmailCode(savedEmail)
      if (result.success) showToast('Код отправлен повторно', '📧')
      else setError(result.error || 'Ошибка')
    })
  }

  function handleSaveStartupRequisites() {
    setError('')
    if (!startupReq.phone.trim() || !startupReq.bankName.trim() || !startupReq.accountNumber.trim() || !startupReq.accountHolder.trim()) {
      setError('Заполните все реквизиты')
      return
    }
    const fd = new FormData()
    fd.set('phone', startupReq.phone.trim())
    fd.set('bankName', startupReq.bankName.trim())
    fd.set('accountNumber', startupReq.accountNumber.trim())
    fd.set('accountHolder', startupReq.accountHolder.trim())

    startTransition(async () => {
      const result = await saveStartupRequisitesAfterSignup(fd)
      if (!result.success) {
        setError(result.error || 'Ошибка сохранения реквизитов')
        return
      }
      closeModal()
      resetState()
      showToast('Стартап зарегистрирован! Добро пожаловать!', '🚀')
      router.push(result.redirect || '/startup')
      router.refresh()
    })
  }

  return (
    <Overlay id="register">
      <h2>Регистрация</h2>

      {step === 'form' && (
        <>
          <div className="tabs">
            <button className={`tab${tab === 0 ? ' active' : ''}`} onClick={() => { setTab(0); setError('') }}>Стартап</button>
            <button className={`tab${tab === 1 ? ' active' : ''}`} onClick={() => { setTab(1); setError('') }}>Инвестор</button>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>{error}</div>}

          {/* Startup form */}
          {tab === 0 && (
            <form id="regStartupForm" onSubmit={(e) => { e.preventDefault(); handleSendCode('startup') }}>
              <div className="form-group"><label>Название стартапа</label><input name="startupName" placeholder="ТехЧечня" required /></div>
              <div className="form-group"><label>ФИО основателя</label><input name="fullName" placeholder="Алихан Мусаев" required /></div>
              <div className="form-group"><label>Email</label><input name="email" type="email" placeholder="founder@startup.ru" required /></div>
              <div className="form-group"><label>Пароль</label><PasswordInput minLength={6} /></div>
              <div className="form-group">
                <label>Отрасль</label>
                <select name="sector">
                  <option>IT / Технологии</option>
                  <option>Агротех</option>
                  <option>Финтех</option>
                  <option>Логистика</option>
                  <option>Ритейл</option>
                </select>
              </div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '.82rem', color: 'var(--text-dim)' }}>
                ✓ Регистрация стартапа бесплатна<br />
                ✓ Комиссия 8% взимается только при инвестиционной сделке<br />
                ✓ Принимая соглашение, вы подтверждаете, что сделки будут проводиться только через LamInvest
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="agreeStartup" required />
                <label htmlFor="agreeStartup" style={{ fontSize: '.85rem', color: 'var(--text-dim)' }}>
                  Я принимаю{' '}
                  <a style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); openModal('terms') }}>Пользовательское соглашение</a>{' '}
                  и подтверждаю правила платформы
                </label>
              </div>
              <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} disabled={isPending}>
                {isPending ? 'Отправка кода...' : 'Продолжить →'}
              </button>
            </form>
          )}

          {/* Investor form */}
          {tab === 1 && (
            <form id="regInvestorForm" onSubmit={(e) => { e.preventDefault(); handleSendCode('investor') }}>
              <div className="form-group"><label>ФИО</label><input name="fullName" placeholder="Рустам Бекмурзаев" required /></div>
              <div className="form-group"><label>Email</label><input name="email" type="email" placeholder="investor@mail.ru" required /></div>
              <div className="form-group"><label>Пароль</label><PasswordInput minLength={6} /></div>
              <div style={{ background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.2)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '.82rem', color: 'var(--text-dim)' }}>
                ⚠️ Комиссия платформы составляет <strong style={{ color: 'var(--gold)' }}>8%</strong> от суммы инвестиций. Данный размер фиксирован и не может быть оспорен.<br /><br />
                Все действия в системе логируются для юридической прозрачности сделок.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="agreeInvestor" required />
                <label htmlFor="agreeInvestor" style={{ fontSize: '.85rem', color: 'var(--text-dim)' }}>Я принимаю соглашение и подтверждаю комиссию 8%</label>
              </div>
              <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} disabled={isPending}>
                {isPending ? 'Отправка кода...' : 'Продолжить →'}
              </button>
            </form>
          )}
        </>
      )}

      {/* Code verification step */}
      {step === 'code' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '.9rem', marginBottom: 8 }}>Код отправлен на</p>
          <p style={{ color: 'var(--gold)', fontSize: '1rem', fontWeight: 600, marginBottom: 24 }}>{savedEmail}</p>

          {error && <div style={{ color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>{error}</div>}

          <div className="form-group">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '12px', fontWeight: 700, color: 'var(--gold)' }}
            />
          </div>

          <button
            className="btn btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            disabled={isPending || code.length !== 6}
            onClick={() => handleVerifyAndRegister(tab === 0 ? 'startup' : 'investor')}
          >
            {isPending ? 'Проверка...' : 'Подтвердить и зарегистрироваться'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            <a style={{ color: 'var(--text-dim)', cursor: 'pointer', fontSize: '.85rem' }} onClick={() => { resetState() }}>← Назад</a>
            <a style={{ color: 'var(--gold)', cursor: 'pointer', fontSize: '.85rem' }} onClick={handleResend}>Отправить код повторно</a>
          </div>

          <p style={{ color: 'var(--text-dim)', fontSize: '.75rem', marginTop: 16 }}>Код действителен 10 минут</p>
        </div>
      )}

      {/* Startup requisites step */}
      {step === 'startupRequisites' && (
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10, color: 'var(--gold)' }}>Реквизиты для получения инвестиций</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '.85rem', marginBottom: 18 }}>
            После подтверждения email укажите банковские реквизиты стартапа. Эти данные будут доступны администратору для переводов.
          </p>
          {error && <div style={{ color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>{error}</div>}
          <div className="form-group">
            <label>Телефон</label>
            <input
              placeholder="+7 (900) 000-00-00"
              value={startupReq.phone}
              onChange={(e) => setStartupReq((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Банк</label>
            <input
              placeholder="Сбербанк / Т-Банк / ВТБ..."
              value={startupReq.bankName}
              onChange={(e) => setStartupReq((s) => ({ ...s, bankName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Номер карты / счёта</label>
            <input
              placeholder="0000 0000 0000 0000"
              value={startupReq.accountNumber}
              onChange={(e) => setStartupReq((s) => ({ ...s, accountNumber: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>ФИО держателя счёта</label>
            <input
              placeholder="Иванов Иван Иванович"
              value={startupReq.accountHolder}
              onChange={(e) => setStartupReq((s) => ({ ...s, accountHolder: e.target.value }))}
            />
          </div>
          <button
            className="btn btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
            onClick={handleSaveStartupRequisites}
            disabled={isPending}
          >
            {isPending ? 'Сохранение...' : 'Сохранить реквизиты и продолжить'}
          </button>
        </div>
      )}
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  3. TERMS                                                           */
/* ------------------------------------------------------------------ */
function TermsModal() {
  const { closeModal, showToast } = useApp()
  return (
    <Overlay id="terms" style={{ maxWidth: 680 }}>
      <h2>Пользовательское соглашение</h2>
      <div style={{ color: 'var(--text-dim)', fontSize: '.85rem', lineHeight: 1.8, maxHeight: '60vh', overflowY: 'auto' }}>
        <p><strong style={{ color: 'var(--gold)' }}>1. Комиссия платформы</strong><br />
        Оператор платформы LamInvest взимает комиссию в размере <strong style={{ color: 'var(--gold)' }}>8% (восемь процентов)</strong> от суммы каждой инвестиционной сделки, совершённой через платформу. Данный размер комиссии является фиксированным, закреплён в настоящем Соглашении и <strong style={{ color: 'var(--text)' }}>не может быть изменён, оспорен или пересмотрен</strong> ни инвестором, ни стартапом в одностороннем порядке.</p>
        <br />
        <p><strong style={{ color: 'var(--gold)' }}>2. Обязательность проведения сделок через платформу</strong><br />
        Все инвестиционные сделки между инвесторами и стартапами, познакомившимися через LamInvest, должны быть проведены исключительно через функционал платформы. Сделка считается совершённой и защищённой только при использовании платёжного и документального функционала LamInvest.</p>
        <br />
        <p><strong style={{ color: 'var(--gold)' }}>3. Запрет обходных сделок</strong><br />
        Заключение сделок, договорённостей или переводов вне платформы с целью избежать уплаты комиссии является грубым нарушением настоящего Соглашения. Нарушение влечёт <strong style={{ color: 'var(--red)' }}>немедленную блокировку профиля</strong> и может стать основанием для юридических претензий.</p>
        <br />
        <p><strong style={{ color: 'var(--gold)' }}>4. Защита конфиденциальной информации</strong><br />
        Просматривая детальные материалы стартапа (финансовые показатели, техническая документация, бизнес-план), инвестор подтверждает принятие условий NDA (соглашения о неразглашении). Передача, копирование или разглашение данных материалов третьим лицам запрещена.</p>
        <br />
        <p><strong style={{ color: 'var(--gold)' }}>5. Ответственность</strong><br />
        Стартап несёт ответственность за достоверность предоставленной информации. Инвестор несёт ответственность за подлинность документов при верификации. LamInvest не является стороной инвестиционной сделки, а выступает платформой-посредником.</p>
      </div>
      <button className="btn btn-gold" style={{ marginTop: 20 }} onClick={() => { closeModal(); showToast('Соглашение принято', '✅') }}>Принять и закрыть</button>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  4. NDA                                                             */
/* ------------------------------------------------------------------ */
function NDAModal() {
  const { closeModal, openModal, showToast } = useApp()
  return (
    <Overlay id="nda" style={{ textAlign: 'center', maxWidth: 520 }}>
      <h2>🔐 Соглашение о неразглашении</h2>
      <p style={{ color: '#8A8680', fontSize: '.9rem', lineHeight: 1.7, marginBottom: 24 }}>
        Вы запрашиваете доступ к конфиденциальным материалам стартапа. Просматривая данные документы, вы подтверждаете, что не будете раскрывать, копировать или передавать информацию третьим лицам.
      </p>
      <div style={{ background: '#222836', borderRadius: 10, padding: 16, marginBottom: 24, textAlign: 'left', fontSize: '.82rem', color: '#8A8680' }}>
        <div style={{ marginBottom: 6 }}>📋 Документы: <strong style={{ color: '#E8E4DC' }}>PitchDeck + Финансовая модель</strong></div>
        <div style={{ marginBottom: 6 }}>🏢 Стартап: <strong style={{ color: '#E8E4DC' }}>ТехЧечня</strong></div>
        <div>📅 Дата: <strong style={{ color: '#E8E4DC' }}>15.05.2026</strong></div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={() => closeModal()}>Отмена</button>
        <button className="btn btn-gold" onClick={() => { closeModal(); showToast('NDA подписан!', '🔐'); openModal('docsViewer') }}>Подписать NDA и открыть файлы</button>
      </div>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  5. DOCS VIEWER                                                     */
/* ------------------------------------------------------------------ */
function DocsViewerModal() {
  const { activeModal, closeModal, openModal } = useApp()
  const [docTab, setDocTab] = useState<'pitchdeck' | 'finance'>('pitchdeck')

  return (
    <div
      className={`modal-overlay${activeModal === 'docsViewer' ? ' active' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className="modal" style={{ maxWidth: 820, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#1A1E26', padding: '18px 24px', borderBottom: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#C9A84C', fontSize: '1.1rem' }}>🔐</span>
            <span style={{ fontWeight: 600, color: '#E8E4DC' }}>Защищённый просмотр документов</span>
            <span style={{ background: 'rgba(46,204,113,.15)', color: '#2ECC71', border: '1px solid rgba(46,204,113,.3)', borderRadius: 20, padding: '3px 12px', fontSize: '.72rem', fontWeight: 700 }}>NDA ПОДПИСАН</span>
          </div>
          <button className="modal-close" style={{ position: 'static' }} onClick={() => closeModal()}>✕</button>
        </div>

        {/* Doc tabs */}
        <div style={{ display: 'flex', background: '#111318', borderBottom: '1px solid rgba(201,168,76,.15)' }}>
          <button
            onClick={() => setDocTab('pitchdeck')}
            style={{ flex: 1, padding: '14px 20px', background: docTab === 'pitchdeck' ? '#1A1E26' : 'transparent', color: docTab === 'pitchdeck' ? '#C9A84C' : '#8A8680', border: 'none', borderBottom: docTab === 'pitchdeck' ? '2px solid #C9A84C' : '2px solid transparent', fontFamily: "'Jost',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          >📊 PitchDeck</button>
          <button
            onClick={() => setDocTab('finance')}
            style={{ flex: 1, padding: '14px 20px', background: docTab === 'finance' ? '#1A1E26' : 'transparent', color: docTab === 'finance' ? '#C9A84C' : '#8A8680', border: 'none', borderBottom: docTab === 'finance' ? '2px solid #C9A84C' : '2px solid transparent', fontFamily: "'Jost',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          >📈 Финансовая модель</button>
        </div>

        {/* Watermark notice */}
        <div style={{ background: 'rgba(201,168,76,.06)', borderBottom: '1px solid rgba(201,168,76,.15)', padding: '8px 24px', fontSize: '.75rem', color: '#8A8680', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💧</span> Документ защищён персональными водяными знаками. Скачивание недоступно. Просмотр логируется.
        </div>

        {/* PITCHDECK */}
        {docTab === 'pitchdeck' && (
          <div style={{ padding: 28, maxHeight: '65vh', overflowY: 'auto' }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', transform: 'rotate(-25deg)', fontSize: '3.5rem', fontWeight: 900, color: 'rgba(201,168,76,.055)', fontFamily: "'Playfair Display',serif", letterSpacing: 6, whiteSpace: 'nowrap', zIndex: 10 }}>WAYINVEST РУСТАМ Б.</div>
              {/* Slide 1 */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 32, marginBottom: 16, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '.72rem', color: '#8A8680', position: 'absolute', top: 12, right: 16 }}>Слайд 1 / 10</div>
                <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🚀</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: '#C9A84C', fontWeight: 700, marginBottom: 8 }}>ТехЧечня</div>
                <div style={{ color: '#8A8680', fontSize: '1rem' }}>Маркетплейс локальных услуг</div>
                <div style={{ marginTop: 16, color: '#E8E4DC', fontSize: '.9rem' }}>Pre-seed раунд • 2026</div>
              </div>
              {/* Slide 2 */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 28, marginBottom: 16 }}>
                <div style={{ fontSize: '.72rem', color: '#8A8680', textAlign: 'right', marginBottom: 12 }}>Слайд 2 / 10 — Проблема</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#C9A84C', marginBottom: 16 }}>Проблема</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ fontSize: '1.6rem', marginBottom: 8 }}>😤</div><div style={{ fontSize: '.85rem', color: '#E8E4DC' }}>Сложно найти надёжного мастера</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ fontSize: '1.6rem', marginBottom: 8 }}>📞</div><div style={{ fontSize: '.85rem', color: '#E8E4DC' }}>Только сарафанное радио</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ fontSize: '1.6rem', marginBottom: 8 }}>💸</div><div style={{ fontSize: '.85rem', color: '#E8E4DC' }}>Нет прозрачного ценообразования</div></div>
                </div>
              </div>
              {/* Slide 3 */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 28, marginBottom: 16 }}>
                <div style={{ fontSize: '.72rem', color: '#8A8680', textAlign: 'right', marginBottom: 12 }}>Слайд 3 / 10 — Решение</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#C9A84C', marginBottom: 16 }}>Наше решение</div>
                <div style={{ color: '#8A8680', fontSize: '.9rem', lineHeight: 1.7, marginBottom: 16 }}>ТехЧечня — мобильный маркетплейс, который соединяет жителей Грозного и ЧР с проверенными исполнителями услуг: ремонт, уборка, репетиторство, доставка и ещё 12 категорий.</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(201,168,76,.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 14px', fontSize: '.82rem' }}>✓ Рейтинги и отзывы</span>
                  <span style={{ background: 'rgba(201,168,76,.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 14px', fontSize: '.82rem' }}>✓ Онлайн-оплата</span>
                  <span style={{ background: 'rgba(201,168,76,.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '5px 14px', fontSize: '.82rem' }}>✓ Гарантия сделки</span>
                </div>
              </div>
              {/* Slide 4 */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 28, marginBottom: 16 }}>
                <div style={{ fontSize: '.72rem', color: '#8A8680', textAlign: 'right', marginBottom: 12 }}>Слайд 4 / 10 — Тяга</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#C9A84C', marginBottom: 20 }}>Результаты за 12 месяцев</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 14, textAlign: 'center' }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#C9A84C', fontWeight: 700 }}>1 200</div><div style={{ color: '#8A8680', fontSize: '.75rem', marginTop: 4 }}>Пользователей</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 14, textAlign: 'center' }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#C9A84C', fontWeight: 700 }}>200</div><div style={{ color: '#8A8680', fontSize: '.75rem', marginTop: 4 }}>Исполнителей</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 14, textAlign: 'center' }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#C9A84C', fontWeight: 700 }}>₽4.2М</div><div style={{ color: '#8A8680', fontSize: '.75rem', marginTop: 4 }}>ARR</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 14, textAlign: 'center' }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#C9A84C', fontWeight: 700 }}>4.8★</div><div style={{ color: '#8A8680', fontSize: '.75rem', marginTop: 4 }}>Рейтинг App Store</div></div>
                </div>
              </div>
              {/* Slide 5 */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 28 }}>
                <div style={{ fontSize: '.72rem', color: '#8A8680', textAlign: 'right', marginBottom: 12 }}>Слайд 5 / 10 — Запрос</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#C9A84C', marginBottom: 16 }}>Мы ищем инвестиции</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 18 }}><div style={{ color: '#C9A84C', fontWeight: 700, marginBottom: 6 }}>Сумма раунда</div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#E8E4DC' }}>₽10 000 000</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 18 }}><div style={{ color: '#C9A84C', fontWeight: 700, marginBottom: 6 }}>Использование средств</div><div style={{ fontSize: '.85rem', color: '#8A8680', lineHeight: 1.5 }}>Маркетинг 40% • Разработка 35% • Операции 25%</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FINANCE */}
        {docTab === 'finance' && (
          <div style={{ padding: 28, maxHeight: '65vh', overflowY: 'auto' }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', transform: 'rotate(-25deg)', fontSize: '3.5rem', fontWeight: 900, color: 'rgba(201,168,76,.055)', fontFamily: "'Playfair Display',serif", letterSpacing: 6, whiteSpace: 'nowrap', zIndex: 10 }}>WAYINVEST РУСТАМ Б.</div>
              {/* Revenue table */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: '#C9A84C', marginBottom: 18 }}>📊 Выручка и рост (₽)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,.25)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Квартал</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Выручка</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Рост MoM</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Пользователей</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Q1 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>₽680 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71' }}>+18%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>340</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Q2 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>₽890 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71' }}>+31%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>620</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Q3 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>₽1 150 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71' }}>+29%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>890</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Q4 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#C9A84C', fontWeight: 700 }}>₽1 480 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71' }}>+29%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#C9A84C', fontWeight: 700 }}>1 200</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Unit economics */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: '#C9A84C', marginBottom: 18 }}>💡 Юнит-экономика</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ color: '#8A8680', fontSize: '.75rem', marginBottom: 6 }}>CAC</div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#E8E4DC' }}>₽320</div><div style={{ color: '#8A8680', fontSize: '.72rem' }}>стоимость привлечения</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ color: '#8A8680', fontSize: '.75rem', marginBottom: 6 }}>LTV</div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2ECC71' }}>₽4 800</div><div style={{ color: '#8A8680', fontSize: '.72rem' }}>жизненная ценность</div></div>
                  <div style={{ background: '#1A1E26', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ color: '#8A8680', fontSize: '.75rem', marginBottom: 6 }}>LTV/CAC</div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C9A84C' }}>15x</div><div style={{ color: '#8A8680', fontSize: '.72rem' }}>коэффициент окупаемости</div></div>
                </div>
              </div>
              {/* Forecast */}
              <div style={{ background: '#111318', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 24 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: '#C9A84C', marginBottom: 18 }}>📅 Прогноз 2026 (с инвестицией ₽10М)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,.25)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Месяц</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Выручка</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>Расходы</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#8A8680', fontWeight: 600 }}>EBITDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Янв 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>₽1 700 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E74C3C' }}>₽1 400 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71' }}>₽300 000</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Мар 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8E4DC' }}>₽2 100 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E74C3C' }}>₽1 550 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71' }}>₽550 000</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', color: '#E8E4DC' }}>Май 2026</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#C9A84C', fontWeight: 700 }}>₽3 200 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E74C3C' }}>₽1 800 000</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2ECC71', fontWeight: 700 }}>₽1 400 000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ background: '#1A1E26', borderTop: '1px solid rgba(201,168,76,.15)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', color: '#8A8680' }}>🔒 Просмотр защищён NDA • Действия логируются • Рустам Бекмурзаев • 15.05.2026</span>
          <button className="btn btn-gold btn-sm" onClick={() => { closeModal(); openModal('newDeal') }}>Инвестировать в стартап →</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  6. PACKAGE                                                         */
/* ------------------------------------------------------------------ */
function PackageModal() {
  const { closeModal, openModal } = useApp()
  return (
    <Overlay id="package" style={{ textAlign: 'center' }}>
      <h2>Подключить тариф</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>Улучшите видимость вашего стартапа</p>
      <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { closeModal(); openModal('register') }}>Зарегистрироваться и подключить →</button>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  7. UPGRADE                                                         */
/* ------------------------------------------------------------------ */
function UpgradeModal() {
  const { closeModal, showToast } = useApp()
  return (
    <Overlay id="upgrade" style={{ textAlign: 'center' }}>
      <h2>Улучшить тариф</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>Выберите способ оплаты для перехода на Премиум (₽12 900/мес)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, textAlign: 'left' }}>
        <div style={{ padding: 14, background: 'var(--dark3)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: 12 }}><span>💳</span><span>Банковская карта</span></div>
        <div style={{ padding: 14, background: 'var(--dark3)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: 12 }}><span>📱</span><span>Сбербанк Онлайн / СБП</span></div>
      </div>
      <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { closeModal(); showToast('Тариф Премиум активирован!', '🌟') }}>Оплатить ₽12 900 →</button>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  8. NEW DEAL                                                        */
/* ------------------------------------------------------------------ */
function NewDealModal() {
  const { closeModal, showToast } = useApp()
  const [amount, setAmount] = useState('')
  const num = parseFloat(amount) || 0
  const commission = num * 0.08
  const total = num + commission

  function fmt(v: number) {
    return v ? v.toLocaleString('ru-RU') + ' ₽' : '—'
  }

  return (
    <Overlay id="newDeal">
      <h2>Новая инвестиционная сделка</h2>
      <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: '.83rem', color: 'var(--text-dim)' }}>
        Сделка будет проведена через платформу LamInvest. Комиссия <strong style={{ color: 'var(--gold)' }}>8%</strong> будет удержана автоматически.
      </div>
      <div className="form-group">
        <label>Стартап</label>
        <select><option>ТехЧечня</option><option>ГрозАгро</option></select>
      </div>
      <div className="form-group">
        <label>Сумма инвестиций (₽)</label>
        <input type="number" placeholder="10000000" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div style={{ background: 'var(--dark3)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
        <div className="flex-between" style={{ fontSize: '.88rem', marginBottom: 6 }}><span>Сумма инвестиции:</span><span>{fmt(num)}</span></div>
        <div className="flex-between" style={{ fontSize: '.88rem', marginBottom: 6 }}><span>Комиссия LamInvest (8%):</span><span style={{ color: 'var(--gold)' }}>{fmt(commission)}</span></div>
        <div className="flex-between" style={{ fontSize: '.95rem', fontWeight: 600, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}><span>Итого к оплате:</span><span>{fmt(total)}</span></div>
      </div>
      <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { closeModal(); showToast('Сделка инициирована! Стартап получил уведомление.', '🤝') }}>Инициировать сделку →</button>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  9. ADD EVENT                                                       */
/* ------------------------------------------------------------------ */
function AddEventModal() {
  const { closeModal, showToast } = useApp()
  return (
    <Overlay id="addEvent">
      <h2>Создать мероприятие</h2>
      <div className="form-group"><label>Название</label><input placeholder="Питч-день LamInvest #5" /></div>
      <div className="form-group">
        <label>Тип</label>
        <select><option>Питч-сессия</option><option>Вебинар</option><option>Мастер-класс</option></select>
      </div>
      <div className="form-group"><label>Дата и время</label><input type="datetime-local" /></div>
      <div className="form-group"><label>Описание</label><textarea placeholder="Описание мероприятия..."></textarea></div>
      <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { closeModal(); showToast('Мероприятие создано и опубликовано!', '📅') }}>Опубликовать →</button>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  10. STARTUP DETAIL                                                 */
/* ------------------------------------------------------------------ */
function StartupDetailModal() {
  const { closeModal, openModal } = useApp()
  return (
    <Overlay id="startupDetail" style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="sc-logo" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>🌾</div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: 'var(--gold)', fontSize: '1.4rem' }}>ГрозАгро</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>Агротех • Seed • Грозный, ЧР</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className="badge badge-gold">Премиум</span>
          </div>
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="stat-box"><div className="num">₽12М</div><div className="lbl">Нужны инвестиции</div></div>
        <div className="stat-box"><div className="num">₽8.4М</div><div className="lbl">ARR</div></div>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.7, marginBottom: 20 }}>
        Платформа для прямых продаж сельскохозяйственной продукции фермерами конечным потребителям. 340 фермеров, 12 000 покупателей в ЧР.
      </p>
      <div className="watermarked" style={{ background: 'var(--dark3)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div className="watermark-text">WAYINVEST NDA</div>
        <div style={{ fontSize: '.82rem', color: 'var(--text-dim)', position: 'relative', zIndex: 1 }}>📊 Детальные финансовые показатели и питч-дек доступны после подписания NDA</div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-gold" onClick={() => { closeModal(); openModal('nda') }}>🔐 Подписать NDA и открыть файлы</button>
        <button className="btn btn-outline" onClick={() => closeModal()}>💬 Написать стартапу</button>
      </div>
    </Overlay>
  )
}

/* ------------------------------------------------------------------ */
/*  EXPORT: All modals container                                       */
/* ------------------------------------------------------------------ */
export function Modals() {
  return (
    <>
      <LoginModal />
      <RegisterModal />
      <TermsModal />
      <NDAModal />
      <DocsViewerModal />
      <PackageModal />
      <UpgradeModal />
      <NewDealModal />
      <AddEventModal />
      <StartupDetailModal />
    </>
  )
}
